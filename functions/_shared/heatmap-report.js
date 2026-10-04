import {
  HEATMAP_PAGES,
  GRID_SIZE,
  HEATMAP_THEMES,
  VIEWPORT_BANDS,
  getHeatmapTarget,
  getHeatmapPage,
  getReportWindow,
  validateReportFilters,
} from '../../shared/heatmap-contract.js';
import { HEATMAP_COLUMNS as C, HEATMAP_DATASET } from './heatmap-storage.js';
import { readBoundedJson } from './access.js';

const LIMITS = Object.freeze({ pages: 5, targets: 500, days: 90, cells: 5000 });
const MAX_BYTES = 524_288;
const MAX_COUNT = 1_000_000_000_000;
const unavailableContext = () => ({
  status: 'unavailable',
  source: 'Cloudflare Web Analytics',
});

function datasetName(env) {
  const name = env.HEATMAP_DATASET ?? HEATMAP_DATASET;
  if (typeof name !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(name))
    throw new TypeError('Invalid dataset');
  return name;
}

/** All interpolated dimensions come from exact enums; SQL is never client input. */
export function buildHeatmapQueries(input, env, now = Date.now()) {
  const filters = validateReportFilters(input);
  const window = getReportWindow(filters.range, now);
  const dataset = datasetName(env);
  const conditions = [
    `timestamp >= toDateTime(${Date.parse(window.start) / 1000})`,
    `timestamp <= toDateTime(${Math.floor(Date.parse(window.end) / 1000)})`,
    `${C.version} = 1`,
    `${C.page} IN (${HEATMAP_PAGES.map(({ path }) => `'${path}'`).join(', ')})`,
  ];
  if (filters.mode === 'page') conditions.push(`${C.page} = '${filters.page}'`);
  if (filters.viewport !== 'all')
    conditions.push(`${C.viewport} = '${filters.viewport}'`);
  const where = conditions.join(' AND ');
  const counts =
    'SUM(_sample_interval) AS count, COUNT() AS observed, MAX(_sample_interval) AS maxSample';
  const query = (columns, groups, limit, extra = '') =>
    `SELECT ${columns}, ${counts} FROM ${dataset} WHERE ${where}${extra} GROUP BY ${groups} LIMIT ${limit + 1} FORMAT JSON`;
  const days = query(
    "formatDateTime(timestamp, '%Y-%m-%d') AS date",
    'date',
    LIMITS.days
  );
  if (filters.mode === 'overview')
    return { pages: query(`${C.page} AS page`, C.page, LIMITS.pages), days };
  return {
    targets: query(`${C.target} AS target`, C.target, LIMITS.targets),
    days,
    cells: query(
      `${C.target} AS target, ${C.layout} AS layout, ${C.build} AS build, ${C.viewport} AS viewport, ${C.theme} AS theme, ${C.state} AS state, ${C.x} AS x, ${C.y} AS y`,
      [
        C.target,
        C.layout,
        C.build,
        C.viewport,
        C.theme,
        C.state,
        C.x,
        C.y,
      ].join(', '),
      LIMITS.cells,
      ` AND ${C.kind} = 'pointer'`
    ),
  };
}

function integer(value, min = 0, max = MAX_COUNT) {
  if (
    typeof value !== 'number' &&
    (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value))
  )
    throw new TypeError('Invalid aggregate number');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new TypeError('Invalid aggregate number');
  return number;
}
function identifier(value, max = 96) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value)
  )
    throw new TypeError('Invalid aggregate dimension');
  return value;
}
function exactRow(row, fields) {
  if (
    !row ||
    typeof row !== 'object' ||
    Array.isArray(row) ||
    Object.keys(row).length !== fields.length ||
    !fields.every((field) => Object.hasOwn(row, field))
  )
    throw new TypeError('Invalid aggregate row');
}
function dimensions(kind, row, filters, window) {
  if (kind === 'pages') {
    if (!getHeatmapPage(row.page))
      throw new TypeError('Invalid aggregate page');
    return { page: row.page };
  }
  if (kind === 'days') {
    if (
      typeof row.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      row.date < window.start.slice(0, 10) ||
      row.date > window.end.slice(0, 10)
    )
      throw new TypeError('Invalid aggregate date');
    return { date: row.date };
  }
  const target = identifier(row.target);
  if (kind === 'targets') return { target };
  // Historical layout revisions and retired IDs remain counts, and are returned
  // for the UI to decide whether an overlay can match today's rendered target.
  const layout = identifier(row.layout, 64);
  const state = identifier(row.state);
  if (
    typeof row.build !== 'string' ||
    !/^(?:local|[a-f0-9]{7,40})$/.test(row.build) ||
    !VIEWPORT_BANDS.some(({ id }) => id === row.viewport) ||
    !HEATMAP_THEMES.includes(row.theme) ||
    (filters.viewport !== 'all' && filters.viewport !== row.viewport)
  )
    throw new TypeError('Invalid aggregate layout');
  return {
    target,
    layout,
    build: row.build,
    viewport: row.viewport,
    theme: row.theme,
    state,
    x: integer(row.x, 0, GRID_SIZE - 1),
    y: integer(row.y, 0, GRID_SIZE - 1),
  };
}

function validateRows(payload, kind, filters, window) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    payload.success === false ||
    (payload.errors &&
      (!Array.isArray(payload.errors) || payload.errors.length > 0)) ||
    !Array.isArray(payload.data) ||
    integer(payload.rows) !== payload.data.length ||
    payload.data.length > LIMITS[kind]
  )
    throw new TypeError('Invalid or truncated aggregate result');
  if (
    payload.rows_before_limit_at_least !== undefined &&
    integer(payload.rows_before_limit_at_least) > LIMITS[kind]
  )
    throw new TypeError('Truncated aggregate result');
  const fields = {
    pages: ['page'],
    days: ['date'],
    targets: ['target'],
    cells: [
      'target',
      'layout',
      'build',
      'viewport',
      'theme',
      'state',
      'x',
      'y',
    ],
  }[kind];
  const seen = new Set();
  return payload.data.map((row) => {
    exactRow(row, [...fields, 'count', 'observed', 'maxSample']);
    const values = dimensions(kind, row, filters, window);
    const key = JSON.stringify(values);
    if (seen.has(key)) throw new TypeError('Duplicate aggregate row');
    seen.add(key);
    const count = integer(row.count, 1);
    const observed = integer(row.observed, 1);
    const maxSample = integer(row.maxSample, 1, 1_000_000_000);
    if (
      count < observed ||
      count < maxSample ||
      count > observed * maxSample ||
      (maxSample === 1 && count !== observed)
    )
      throw new TypeError('Invalid weighted aggregate');
    return { ...values, count, sampled: maxSample > 1 };
  });
}

async function fetchJson(url, init, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      ...init,
      redirect: 'error',
      signal: controller.signal,
    });
    return await readBoundedJson(response, {
      maxBytes: MAX_BYTES,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function pageViewContext(filters, window, env, fetchImpl, timeoutMs) {
  const token = env.HEATMAP_WEB_ANALYTICS_TOKEN;
  const site = env.HEATMAP_WEB_ANALYTICS_SITE_TAG;
  const host = env.HEATMAP_WEB_ANALYTICS_HOST;
  if (
    filters.viewport !== 'all' ||
    typeof token !== 'string' ||
    !token ||
    token.length > 4096 ||
    typeof site !== 'string' ||
    !/^[a-f0-9]{32}$/.test(site) ||
    typeof host !== 'string' ||
    !/^[a-z0-9.-]{1,253}$/.test(host)
  )
    return unavailableContext();
  try {
    const query = `query HeatmapPageViews($account: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) { viewer { accounts(filter: {accountTag: $account}) { rumPageloadEventsAdaptiveGroups(limit: 451, filter: $filter) { count dimensions { requestPath date } } } } }`;
    const filter = {
      siteTag: site,
      requestHost: host,
      datetime_geq: window.start,
      datetime_leq: window.end,
      ...(filters.mode === 'page'
        ? { requestPath: filters.page }
        : { requestPath_in: HEATMAP_PAGES.map(({ path }) => path) }),
    };
    const payload = await fetchJson(
      'https://api.cloudflare.com/client/v4/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { account: env.HEATMAP_ACCOUNT_ID, filter },
        }),
      },
      fetchImpl,
      timeoutMs
    );
    const accounts = payload?.data?.viewer?.accounts;
    if (
      (payload.errors &&
        (!Array.isArray(payload.errors) || payload.errors.length)) ||
      !Array.isArray(accounts) ||
      accounts.length !== 1
    )
      throw new TypeError('Invalid context');
    const rows = accounts[0].rumPageloadEventsAdaptiveGroups;
    if (!Array.isArray(rows) || rows.length > 450)
      throw new TypeError('Invalid context');
    const seen = new Set();
    const days = rows.map((row) => {
      exactRow(row, ['count', 'dimensions']);
      exactRow(row.dimensions, ['requestPath', 'date']);
      const { requestPath: page, date } = row.dimensions;
      if (
        !getHeatmapPage(page) ||
        (filters.mode === 'page' && page !== filters.page)
      )
        throw new TypeError('Invalid context page');
      dimensions('days', { date }, filters, window);
      const key = `${page}:${date}`;
      if (seen.has(key)) throw new TypeError('Duplicate context');
      seen.add(key);
      return { page, date, count: integer(row.count) };
    });
    const total = days.reduce((sum, row) => integer(sum + row.count), 0);
    return {
      status: total ? 'ready' : 'empty',
      source: 'Cloudflare Web Analytics',
      total,
      days,
      host,
      window,
    };
  } catch {
    console.error('heatmap_page_views_unavailable');
    return unavailableContext();
  }
}

/** Bounded aggregates only. Read failures throw; handlers never turn them into zero. */
export async function readHeatmapReport(
  input,
  env,
  { fetchImpl = fetch, now = Date.now(), timeoutMs = 5000 } = {}
) {
  const filters = validateReportFilters(input);
  const window = getReportWindow(filters.range, now);
  if (
    typeof env.HEATMAP_ACCOUNT_ID !== 'string' ||
    !/^[a-f0-9]{32}$/.test(env.HEATMAP_ACCOUNT_ID) ||
    typeof env.HEATMAP_READ_TOKEN !== 'string' ||
    !env.HEATMAP_READ_TOKEN ||
    env.HEATMAP_READ_TOKEN.length > 4096
  )
    throw new Error('Report configuration unavailable');
  const queries = buildHeatmapQueries(filters, env, now);
  const aggregates = {};
  // At most three bounded queries. Sequential requests avoid exceeding the
  // runtime's connection limit and release each response before the next one.
  for (const [kind, sql] of Object.entries(queries)) {
    const payload = await fetchJson(
      `https://api.cloudflare.com/client/v4/accounts/${env.HEATMAP_ACCOUNT_ID}/analytics_engine/sql`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HEATMAP_READ_TOKEN}`,
          'Content-Type': 'text/plain',
        },
        body: sql,
      },
      fetchImpl,
      timeoutMs
    );
    aggregates[kind] = validateRows(payload, kind, filters, window);
  }
  const primary = aggregates.pages ?? aggregates.targets;
  const total = primary.reduce((sum, row) => integer(sum + row.count), 0);
  const sampled = Object.values(aggregates).some((rows) =>
    rows.some((row) => row.sampled)
  );
  if (!total && (aggregates.days.length || aggregates.cells?.length))
    throw new TypeError('Inconsistent empty aggregate');
  const counts = (row) => {
    const { sampled: _sampled, ...values } = row;
    return values;
  };
  const pages =
    filters.mode === 'overview'
      ? HEATMAP_PAGES.map(({ path: page, label }) => ({
          page,
          label,
          count: primary.find((row) => row.page === page)?.count ?? 0,
        })).map((row) => ({ ...row, share: total ? row.count / total : 0 }))
      : [];
  const targets =
    filters.mode === 'page'
      ? primary
          .map((row) => ({
            target: row.target,
            label:
              getHeatmapTarget(filters.page, row.target)?.label ?? row.target,
            count: row.count,
            share: total ? row.count / total : 0,
          }))
          .sort((a, b) => b.count - a.count || a.target.localeCompare(b.target))
      : [];
  const result = {
    status: total ? 'ready' : 'empty',
    filters,
    window,
    total,
    sampled,
    pages,
    targets,
    days: aggregates.days
      .map(counts)
      .sort((a, b) => a.date.localeCompare(b.date)),
    cells: (aggregates.cells ?? []).map(counts),
    pageViews: await pageViewContext(
      filters,
      window,
      env,
      fetchImpl,
      timeoutMs
    ),
  };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_BYTES)
    throw new TypeError('Report too large');
  return result;
}
