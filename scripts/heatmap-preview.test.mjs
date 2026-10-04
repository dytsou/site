import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  attachHeatmapPreview,
  matchHeatmapCells,
  renderHeatmapOverlay,
  installPreviewNavigation,
} from '../src/components/insights/heatmap-preview.js';
import {
  createReportLoader,
  fillReportDays,
} from '../src/components/insights/report-loader.js';

const cell = {
  target: 'home.projects',
  layout: 'home-v1',
  build: 'abcdef1',
  viewport: 'narrow',
  theme: 'light',
  state: 'default',
  x: 8,
  y: 4,
  count: 12,
};
const current = {
  page: '/',
  layout: 'home-v1',
  viewport: 'narrow',
  theme: 'light',
  targets: [
    {
      target: 'home.projects',
      state: 'default',
      visible: true,
      cardsMatch: true,
      rect: { left: 10, top: 20, width: 160, height: 80 },
      clip: { left: 0, top: 0, right: 390, bottom: 800 },
    },
  ],
};

test('target-local 16×16 points match authored layout, viewport, theme and nearest state', () => {
  const result = matchHeatmapCells([cell], current, '/');
  assert.equal(result.points.length, 1);
  assert.equal(result.points[0].left, 95);
  assert.equal(result.points[0].top, 42.5);
  assert.equal(result.plotted, 12);
  // A new build with the same authored layout remains geometrically compatible.
  assert.equal(
    matchHeatmapCells([{ ...cell, build: 'bbbbbbb' }], current, '/').plotted,
    12
  );
  const combined = matchHeatmapCells(
    [cell, { ...cell, build: 'bbbbbbb', count: 8 }],
    current,
    '/'
  );
  assert.equal(combined.points.length, 1);
  assert.equal(combined.points[0].count, 20);
});

test('stale, different viewport/theme/state, hidden, absent and wrong grouping never plot', () => {
  for (const [change, reason] of [
    [{ layout: 'home-v0' }, 'layout'],
    [{ viewport: 'wide' }, 'viewport'],
    [{ theme: 'dark' }, 'theme'],
    [{ state: 'expanded' }, 'state'],
  ]) {
    const result = matchHeatmapCells([{ ...cell, ...change }], current, '/');
    assert.equal(result.points.length, 0);
    assert.equal(result.omitted[reason], 12);
  }
  for (const [targets, reason] of [
    [[], 'target'],
    [[{ ...current.targets[0], visible: false }], 'hidden'],
    [[{ ...current.targets[0], cardsMatch: false }], 'viewport'],
  ]) {
    const result = matchHeatmapCells([cell], { ...current, targets }, '/');
    assert.equal(result.points.length, 0);
    assert.equal(result.omitted[reason], 12);
  }
  assert.equal(
    matchHeatmapCells([cell], { ...current, page: '/about/' }, '/').omitted
      .layout,
    12
  );
});

test('duplicate targets select the visible matching state and clipped points stay hidden', () => {
  const hidden = { ...current.targets[0], visible: false };
  assert.equal(
    matchHeatmapCells(
      [cell],
      { ...current, targets: [hidden, current.targets[0]] },
      '/'
    ).plotted,
    12
  );
  const clipped = {
    ...current.targets[0],
    clip: { left: 0, top: 0, right: 80, bottom: 800 },
  };
  assert.equal(
    matchHeatmapCells([cell], { ...current, targets: [clipped] }, '/').omitted
      .hidden,
    12
  );
});

test('real overlay renderer has no pointer interception, weights points and clears stale nodes', () => {
  const node = () => ({ style: {}, dataset: {}, setAttribute() {} });
  const doc = { createElement: node };
  const layer = {
    style: {},
    children: [],
    replaceChildren(...children) {
      this.children = children;
    },
  };
  const result = matchHeatmapCells([cell], current, '/');
  renderHeatmapOverlay(doc, layer, result.points);
  assert.equal(layer.style.pointerEvents, 'none');
  assert.equal(layer.children.length, 1);
  assert.equal(layer.children[0].style.left, '95px');
  assert.equal(layer.children[0].dataset.heatmapCount, '12');
  renderHeatmapOverlay(doc, layer, []);
  assert.equal(layer.children.length, 0);
});

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
const overview = { mode: 'overview', range: '7d', viewport: 'all' };
const page = { mode: 'page', page: '/', range: '30d', viewport: 'narrow' };
const response = (filters, total) => ({
  ok: true,
  json: async () => ({
    status: total ? 'ready' : 'empty',
    filters,
    total,
    sampled: false,
    pages: [],
    targets: [],
    cells: [],
    days: [],
    window: { start: '2026-10-01', end: '2026-10-04', days: 7 },
    pageViews: { status: 'unavailable' },
  }),
});

test('filter changes immediately withhold old counts and ignore older success even if abort is ignored', async () => {
  const a = deferred();
  const b = deferred();
  const published = [];
  const requests = [];
  const loader = createReportLoader(
    (url, init) => {
      requests.push({ url, init });
      return requests.length === 1 ? a.promise : b.promise;
    },
    (state) => published.push(state)
  );
  const first = loader.load(overview);
  const second = loader.load(page);
  assert.equal(requests[0].init.signal.aborted, true);
  assert.equal(published.at(-1).status, 'loading');
  assert.equal(published.at(-1).report, undefined);
  b.resolve(response(page, 20));
  await second;
  a.resolve(response(overview, 999));
  await first;
  assert.equal(published.at(-1).report.total, 20);
  assert.deepEqual(published.at(-1).filters, page);
  assert.equal(
    published.some((state) => state.report?.total === 999),
    false
  );
});

test('older failure and cancellation cannot replace a newer report; mismatched applied filters fail closed', async () => {
  const a = deferred();
  const b = deferred();
  const published = [];
  let calls = 0;
  const loader = createReportLoader(
    () => (++calls === 1 ? a.promise : b.promise),
    (state) => published.push(state)
  );
  const first = loader.load(overview);
  const second = loader.load(page);
  b.resolve(response(page, 20));
  await second;
  a.resolve({ ok: false, status: 503 });
  await first;
  assert.equal(published.at(-1).report.total, 20);
  const mismatch = createReportLoader(
    async () => response(overview, 123),
    (state) => published.push(state)
  );
  await mismatch.load(page);
  assert.equal(published.at(-1).status, 'unavailable');
  assert.equal(published.at(-1).report, undefined);
  const c = deferred();
  const canceled = createReportLoader(
    () => c.promise,
    (state) => published.push(state)
  );
  const pending = canceled.load(page);
  const before = published.length;
  canceled.cancel();
  c.resolve(response(page, 456));
  await pending;
  assert.equal(published.length, before);
});

test('service errors are unavailable, owner denial is generic, and valid empty remains empty', async () => {
  for (const [status, expected] of [
    [503, 'unavailable'],
    [403, 'denied'],
    [400, 'invalid'],
  ]) {
    let state;
    await createReportLoader(
      async () => ({ ok: false, status }),
      (next) => {
        state = next;
      }
    ).load(overview);
    assert.equal(state.status, expected);
    assert.equal(state.report, undefined);
  }
  let state;
  await createReportLoader(
    async () => response(overview, 0),
    (next) => {
      state = next;
    }
  ).load(overview);
  assert.equal(state.status, 'empty');
  assert.equal(state.report.total, 0);
});

test('preview captures link, keyboard, middle and form navigation while safe buttons remain interactive', () => {
  const listeners = new Map();
  const doc = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
  };
  const cleanup = installPreviewNavigation(doc, {
    location: { pathname: '/', search: '?heatmap-preview=1' },
  });
  const event = (tag, action, key) => ({
    key,
    target: {
      closest: () => ({
        tagName: tag,
        dataset: { heatmapPreviewAction: action },
      }),
    },
    preventDefault() {
      this.prevented = true;
    },
    stopImmediatePropagation() {
      this.stopped = true;
    },
  });
  for (const name of [
    'click',
    'auxclick',
    'contextmenu',
    'keydown',
    'submit',
  ]) {
    const e = event('A', 'toggle', 'Enter');
    e.type = name;
    listeners.get(name)(e);
    assert.equal(e.prevented, true);
    assert.equal(e.stopped, true);
  }
  for (const action of ['toggle', 'slide']) {
    const e = event('BUTTON', action);
    listeners.get('click')(e);
    assert.equal(e.prevented, undefined);
  }
  const e = event('A', '', 'Tab');
  e.type = 'keydown';
  listeners.get('keydown')(e);
  assert.equal(e.prevented, undefined);
  cleanup();
  assert.equal(listeners.size, 0);
  installPreviewNavigation(doc, {
    location: { pathname: '/insights/', search: '?heatmap-preview=1' },
  });
  assert.equal(listeners.size, 0);
});

test('mobile expansion can collapse again and repeat while preserving authored state', async () => {
  const classes = new Set(['test-collapsed']);
  let click;
  const toggle = {
    dataset: {},
    setAttribute() {},
    addEventListener: (name, fn) => {
      if (name === 'click') click = fn;
    },
  };
  const root = {
    dataset: { heatmapState: 'collapsed' },
    classList: {
      [Symbol.iterator]: () => classes[Symbol.iterator](),
      contains: (c) => classes.has(c),
      toggle: (c, enabled) => (enabled ? classes.add(c) : classes.delete(c)),
    },
    hasAttribute: () => true,
    querySelector: (selector) =>
      selector === '[data-expandable-toggle]' ? toggle : null,
  };
  const originalDocument = globalThis.document;
  const originalMedia = globalThis.matchMedia;
  globalThis.document = {
    readyState: 'complete',
    querySelectorAll: () => [root],
  };
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {} });
  try {
    await import('../src/scripts/client/expandable.ts');
    click({ preventDefault() {} });
    assert.equal(root.dataset.heatmapState, 'expanded');
    click({ preventDefault() {} });
    assert.equal(root.dataset.heatmapState, 'collapsed');
    click({ preventDefault() {} });
    assert.equal(root.dataset.heatmapState, 'expanded');
  } finally {
    globalThis.document = originalDocument;
    globalThis.matchMedia = originalMedia;
  }
});

test('daily activity keeps missing UTC dates in their calendar positions without reconciling independent sampled totals', () => {
  const result = fillReportDays(
    { start: '2026-10-01T12:30:00Z', end: '2026-10-04T12:30:00Z' },
    [
      { date: '2026-10-01', count: 15 },
      { date: '2026-10-04', count: 20 },
    ]
  );
  assert.deepEqual(result, [
    { date: '2026-10-01', count: 15 },
    { date: '2026-10-02', count: 0 },
    { date: '2026-10-03', count: 0 },
    { date: '2026-10-04', count: 20 },
  ]);
});

test('iframe adapter reads real target metadata, batches observations and ignores its own overlay mutations', () => {
  const callbacks = new Map();
  const listeners = new Map();
  let mutation;
  let disconnected = 0;
  let layer;
  let frameId = 0;
  const rect = {
    left: 10,
    top: 20,
    right: 170,
    bottom: 100,
    width: 160,
    height: 80,
  };
  const root = {
    dataset: { heatmapPage: '/', heatmapLayout: 'home-v1' },
    classList: { contains: () => false },
    parentElement: null,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 390,
      bottom: 800,
      width: 390,
      height: 800,
    }),
  };
  const target = {
    dataset: { heatmapTarget: 'home.projects' },
    parentElement: root,
    getBoundingClientRect: () => rect,
    closest: () => null,
  };
  const node = () => ({
    style: {},
    dataset: {},
    setAttribute() {},
    children: [],
    contains: () => false,
    replaceChildren(...children) {
      this.children = children;
    },
    remove() {
      this.removed = true;
    },
  });
  const doc = {
    documentElement: root,
    body: {
      append: (element) => {
        layer = element;
      },
    },
    createElement: node,
    querySelectorAll: () => [target],
    getAnimations: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  const win = {
    location: {
      origin: 'https://example.com',
      pathname: '/',
      search: '?heatmap-preview=1',
    },
    innerWidth: 390,
    innerHeight: 800,
    getComputedStyle: () => ({
      opacity: '1',
      display: 'block',
      visibility: 'visible',
      overflowX: 'visible',
      overflowY: 'visible',
    }),
    requestAnimationFrame: (fn) => {
      callbacks.set(++frameId, fn);
      return frameId;
    },
    cancelAnimationFrame: (id) => callbacks.delete(id),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    MutationObserver: class {
      constructor(fn) {
        mutation = fn;
      }
      observe() {}
      disconnect() {
        disconnected++;
      }
    },
    ResizeObserver: class {
      observe() {}
      disconnect() {
        disconnected++;
      }
    },
  };
  const originalLocation = globalThis.location;
  globalThis.location = { origin: 'https://example.com' };
  const summaries = [];
  try {
    const cleanup = attachHeatmapPreview(
      { contentDocument: doc, contentWindow: win },
      '/',
      [cell],
      (value) => summaries.push(value)
    );
    assert.equal(callbacks.size, 1);
    const draw = [...callbacks.values()][0];
    callbacks.clear();
    draw();
    assert.equal(layer.children.length, 1);
    assert.equal(summaries.at(-1).plotted, 12);
    mutation([{ target: layer }]);
    assert.equal(callbacks.size, 0);
    mutation([{ target }]);
    listeners.get('scroll')();
    assert.equal(callbacks.size, 1);
    cleanup();
    assert.equal(disconnected, 2);
    assert.equal(layer.removed, true);
    assert.equal(callbacks.size, 0);
  } finally {
    globalThis.location = originalLocation;
  }
});
