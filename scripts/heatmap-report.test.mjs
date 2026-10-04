import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildHeatmapQueries,
  readHeatmapReport,
} from '../functions/_shared/heatmap-report.js';
const now = Date.parse('2026-10-04T12:00:00Z');
const env = {
  HEATMAP_ACCOUNT_ID: 'a'.repeat(32),
  HEATMAP_READ_TOKEN: 'private-token',
};
const filters = { mode: 'page', page: '/', range: '7d', viewport: 'all' };
const weighted = (count, observed, maxSample) => ({
  count: String(count),
  observed: String(observed),
  maxSample: String(maxSample),
});
const target = (id, count, observed, sample) => ({
  target: id,
  ...weighted(count, observed, sample),
});
const day = { date: '2026-10-04', ...weighted(13, 4, 5) };
const cell = {
  target: 'home.projects',
  layout: 'home-v1',
  build: 'abcdef1',
  viewport: 'narrow',
  theme: 'light',
  state: 'default',
  x: 2,
  y: 3,
  ...weighted(11, 3, 5),
};
function fixture(rows) {
  return async (_url, init) => {
    const sql = init.body;
    const kind = sql.includes(' AS x')
      ? 'cells'
      : sql.includes(' AS date')
        ? 'days'
        : sql.includes(' AS target')
          ? 'targets'
          : 'pages';
    return Response.json({
      data: rows[kind] ?? [],
      rows: (rows[kind] ?? []).length,
    });
  };
}

test('queries are fixed, UTC bounded, sample weighted and have overflow sentinel limits', () => {
  const queries = buildHeatmapQueries(filters, env, now);
  assert.deepEqual(Object.keys(queries), ['targets', 'days', 'cells']);
  for (const sql of Object.values(queries)) {
    assert.match(sql, /SUM\(_sample_interval\)/);
    assert.match(sql, /MAX\(_sample_interval\)/);
    assert.ok(
      sql.includes(
        `timestamp >= toDateTime(${Date.parse('2026-09-28T00:00:00Z') / 1000})`
      )
    );
    assert.ok(
      sql.includes(`timestamp <= toDateTime(${Math.floor(now / 1000)})`)
    );
    assert.match(sql, /FORMAT JSON$/);
  }
  assert.match(queries.days, /formatDateTime\(timestamp, '%Y-%m-%d'\) AS date/);
  assert.match(queries.cells, /blob7 = 'pointer'/);
  assert.match(queries.cells, /double3 AS x/);
  assert.match(queries.targets, /site_click_events/);
  for (const bad of [
    { ...filters, page: "/'; DROP TABLE x" },
    { ...filters, range: '180d' },
    { ...filters, viewport: 'desktop' },
    { ...filters, sql: 'SELECT *' },
  ])
    assert.throws(() => buildHeatmapQueries(bad, env, now));
  assert.throws(() =>
    buildHeatmapQueries(filters, { ...env, HEATMAP_DATASET: 'x; DROP' }, now)
  );
  assert.match(
    buildHeatmapQueries(
      filters,
      { ...env, HEATMAP_DATASET: 'site_click_events_preview' },
      now
    ).targets,
    /FROM site_click_events_preview/
  );
});

test('varying row sample intervals produce weighted target/day/cell counts and recorded click shares', async () => {
  const result = await readHeatmapReport(filters, env, {
    now,
    fetchImpl: fixture({
      targets: [target('home.projects', 11, 3, 5), target('nav.home', 2, 1, 2)],
      days: [day],
      cells: [cell],
    }),
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.total, 13);
  assert.equal(result.sampled, true);
  assert.equal(result.targets[0].count, 11);
  assert.equal(result.targets[0].share, 11 / 13);
  assert.equal(result.days[0].count, 13);
  assert.equal(result.cells[0].count, 11);
  assert.deepEqual(result.pageViews, {
    status: 'unavailable',
    source: 'Cloudflare Web Analytics',
  });
  assert.doesNotMatch(JSON.stringify(result), /private-token/);
});

test('overview reports each allowed page; stale layout and retired target identifiers remain safe and visible', async () => {
  const overview = await readHeatmapReport(
    { mode: 'overview', range: '30d', viewport: 'wide' },
    env,
    {
      now,
      fetchImpl: fixture({
        pages: [{ page: '/', ...weighted(11, 3, 5) }],
        days: [{ ...day, ...weighted(11, 3, 5) }],
      }),
    }
  );
  assert.equal(overview.pages.length, 5);
  assert.equal(overview.pages[0].count, 11);
  assert.equal(overview.total, 11);
  const result = await readHeatmapReport(filters, env, {
    now,
    fetchImpl: fixture({
      targets: [target('retired.safe-control', 11, 3, 5)],
      days: [{ ...day, ...weighted(11, 3, 5) }],
      cells: [{ ...cell, target: 'retired.safe-control', layout: 'home-v0' }],
    }),
  });
  assert.equal(result.targets[0].label, 'retired.safe-control');
  assert.equal(result.cells[0].layout, 'home-v0');
});

test('empty differs from missing config, invalid rows, HTTP failures, malformed and oversized responses', async () => {
  assert.equal(
    (await readHeatmapReport(filters, env, { now, fetchImpl: fixture({}) }))
      .status,
    'empty'
  );
  await assert.rejects(() => readHeatmapReport(filters, {}, { now }));
  for (const fetchImpl of [
    async () => new Response('secret', { status: 403 }),
    async () => new Response('bad'),
    async () => Response.json({ data: {} }),
    async () => Response.json({ data: [], rows: 2 }),
    fixture({ targets: [target('home.projects', -1, 1, 1)] }),
    fixture({ targets: [target('<script>', 1, 1, 1)] }),
    fixture({
      targets: [
        target('home.projects', 11, 3, 5),
        target('home.projects', 11, 3, 5),
      ],
    }),
    fixture({
      targets: Array.from({ length: 501 }, (_, i) =>
        target(`retired.${i}`, 1, 1, 1)
      ),
    }),
    async () => new Response('x'.repeat(600_000)),
  ])
    await assert.rejects(() =>
      readHeatmapReport(filters, env, { now, fetchImpl })
    );
});

test('timeouts include stalled body streams; optional page-view failures preserve click aggregates', async () => {
  await assert.rejects(() =>
    readHeatmapReport(filters, env, {
      now,
      timeoutMs: 20,
      fetchImpl: async () => new Response(new ReadableStream({ start() {} })),
    })
  );
  const clickFetch = fixture({
    targets: [target('home.projects', 1, 1, 1)],
    days: [{ ...day, ...weighted(1, 1, 1) }],
    cells: [{ ...cell, ...weighted(1, 1, 1) }],
  });
  const result = await readHeatmapReport(
    filters,
    {
      ...env,
      HEATMAP_WEB_ANALYTICS_SITE_TAG: 'b'.repeat(32),
      HEATMAP_WEB_ANALYTICS_HOST: 'dy.tsou.me',
      HEATMAP_WEB_ANALYTICS_TOKEN: 'context-secret',
    },
    {
      now,
      fetchImpl: (url, init) =>
        String(url).includes('/graphql')
          ? Promise.resolve(Response.json({ errors: [{ message: 'failure' }] }))
          : clickFetch(url, init),
    }
  );
  assert.equal(result.total, 1);
  assert.equal(result.pageViews.status, 'unavailable');
  assert.doesNotMatch(JSON.stringify(result), /context-secret|conversion/);
});

test('optional Web Analytics context uses only matched pages/dates and remains separate from click shares', async () => {
  const clicks = fixture({
    targets: [target('home.projects', 1, 1, 1)],
    days: [{ ...day, ...weighted(1, 1, 1) }],
    cells: [{ ...cell, ...weighted(1, 1, 1) }],
  });
  const contextEnv = {
    ...env,
    HEATMAP_WEB_ANALYTICS_SITE_TAG: 'b'.repeat(32),
    HEATMAP_WEB_ANALYTICS_HOST: 'dy.tsou.me',
    HEATMAP_WEB_ANALYTICS_TOKEN: 'context-secret',
  };
  const fetchImpl = async (url, init) => {
    if (!String(url).includes('/graphql')) return clicks(url, init);
    const body = JSON.parse(init.body);
    assert.equal(body.variables.filter.requestPath, '/');
    assert.equal(
      body.variables.filter.datetime_geq,
      '2026-09-28T00:00:00.000Z'
    );
    assert.equal(init.headers.Authorization, 'Bearer context-secret');
    return Response.json({
      data: {
        viewer: {
          accounts: [
            {
              rumPageloadEventsAdaptiveGroups: [
                {
                  count: 10,
                  dimensions: { requestPath: '/', date: '2026-10-04' },
                },
              ],
            },
          ],
        },
      },
    });
  };
  const report = await readHeatmapReport(filters, contextEnv, {
    now,
    fetchImpl,
  });
  assert.equal(report.pageViews.status, 'ready');
  assert.equal(report.pageViews.total, 10);
  assert.equal(report.targets[0].share, 1);
  assert.equal(report.total, 1);
  const filtered = await readHeatmapReport(
    { ...filters, viewport: 'narrow' },
    contextEnv,
    { now, fetchImpl: clicks }
  );
  assert.equal(filtered.pageViews.status, 'unavailable');
});
