import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  HEATMAP_PAGES,
  HEATMAP_TARGETS,
  GRID_SIZE,
  getHeatmapPage,
  getHeatmapTarget,
  getViewportBand,
  quantizeTargetPoint,
  validateHeatmapEvent,
  validateReportFilters,
  getReportWindow,
} from '../shared/heatmap-contract.js';

const now = Date.parse('2026-10-04T12:34:56.000Z');
const pointer = {
  version: 1,
  page: '/',
  target: 'home.projects',
  layout: 'home-v1',
  build: 'abcdef1234567',
  viewport: 'narrow',
  theme: 'light',
  state: 'default',
  kind: 'pointer',
  time: now,
  x: 0,
  y: 15,
  pageX: 40,
  pageY: 200,
};

function keyboard() {
  const { x, y, pageX, pageY, ...event } = pointer;
  return { ...event, kind: 'keyboard' };
}

test('registry covers exactly the public routes and has authored unique targets', async () => {
  const routes = JSON.parse(
    await readFile(
      new URL('../src/data/site-routes.json', import.meta.url),
      'utf8'
    )
  );
  assert.deepEqual(
    HEATMAP_PAGES.map((page) => page.path),
    routes.map(({ path }) => (path === '/' ? path : `${path}/`))
  );
  assert.equal(getHeatmapPage('/insights/'), null);
  assert.equal(getHeatmapPage('/about'), null);
  assert.equal(
    new Set(HEATMAP_TARGETS.map(({ id }) => id)).size,
    HEATMAP_TARGETS.length
  );
  for (const page of HEATMAP_PAGES) {
    assert.match(page.layout, /^[a-z]+-v\d+$/);
    assert.ok(getHeatmapTarget(page.path, 'nav.home'));
    assert.ok(getHeatmapTarget(page.path, 'footer.github'));
    assert.ok(
      HEATMAP_TARGETS.some(
        (target) => target.pages.length === 1 && target.pages[0] === page.path
      )
    );
  }
  assert.equal(getHeatmapTarget('/contact/', 'home.projects'), null);
  assert.equal(
    getHeatmapTarget('/projects/', 'project.arbitrary.github'),
    null
  );
  assert.ok(Object.isFrozen(HEATMAP_PAGES[0]));
  assert.ok(Object.isFrozen(HEATMAP_TARGETS[0].pages));
});

test('pointer and position-less keyboard events have one canonical representation', () => {
  const validated = validateHeatmapEvent(pointer, { now });
  assert.deepEqual(validated, pointer);
  assert.notEqual(validated, pointer);
  assert.deepEqual(validateHeatmapEvent(keyboard(), { now }), keyboard());
  assert.throws(
    () => validateHeatmapEvent({ ...keyboard(), x: 0 }, { now }),
    TypeError
  );
});

test('rejects unknown or mismatched dimensions and unsolicited data', () => {
  for (const change of [
    { page: '/private/' },
    { page: '/about' },
    { page: '/about/?q=private' },
    { page: '/contact/' },
    { target: 'unknown' },
    { layout: 'home-v2' },
    { version: 2 },
    { viewport: 'mobile' },
    { theme: 'system' },
    { kind: 'touch' },
    { state: 'x'.repeat(512) },
    { build: 'https://example.com' },
    { userId: 'visitor' },
    { url: 'https://example.com/?private=1' },
    { time: now - 86_400_001 },
    { time: now + 300_001 },
  ]) {
    assert.throws(
      () => validateHeatmapEvent({ ...pointer, ...change }, { now }),
      TypeError,
      JSON.stringify(change)
    );
  }
  for (const input of [
    null,
    [],
    'event',
    { ...pointer, state: { input: 'private' } },
  ]) {
    assert.throws(() => validateHeatmapEvent(input, { now }), TypeError);
  }
});

test('rejects missing, non-finite, fractional and out-of-range pointer coordinates', () => {
  for (const field of ['x', 'y', 'pageX', 'pageY']) {
    for (const value of [undefined, NaN, Infinity, -1, 0.5, 100_001]) {
      assert.throws(
        () => validateHeatmapEvent({ ...pointer, [field]: value }, { now }),
        TypeError
      );
    }
  }
  assert.throws(
    () => validateHeatmapEvent({ ...pointer, x: GRID_SIZE }, { now }),
    TypeError
  );
  assert.deepEqual(
    validateHeatmapEvent({ ...pointer, pageY: 100_000 }, { now }).pageY,
    100_000
  );
});

test('grid assigns edges deterministically and rejects points outside the target', () => {
  assert.equal(GRID_SIZE, 16);
  assert.deepEqual(quantizeTargetPoint(0, 0), { x: 0, y: 0 });
  assert.deepEqual(quantizeTargetPoint(1, 1), { x: 15, y: 15 });
  assert.deepEqual(quantizeTargetPoint(0.5, 0.5), { x: 8, y: 8 });
  assert.deepEqual(quantizeTargetPoint(1 / 16, 15 / 16), { x: 1, y: 15 });
  for (const value of [-0.001, 1.001, NaN, Infinity]) {
    assert.throws(() => quantizeTargetPoint(value, 0), TypeError);
    assert.throws(() => quantizeTargetPoint(0, value), TypeError);
  }
});

test('viewport bands match carousel grouping at exact responsive boundaries', () => {
  for (const [width, band] of [
    [1, 'narrow'],
    [639, 'narrow'],
    [640, 'medium'],
    [1023, 'medium'],
    [1024, 'wide'],
    [1439, 'wide'],
    [1440, 'extra-wide'],
    [3000, 'extra-wide'],
  ]) {
    assert.equal(getViewportBand(width), band);
  }
  for (const width of [0, -1, NaN, Infinity])
    assert.throws(() => getViewportBand(width), TypeError);
});

test('project and carousel state agrees with the viewport grouping', () => {
  const event = {
    ...pointer,
    page: '/projects/',
    target: 'project.vaehor.github',
    layout: 'projects-v1',
    state: 'slide-3.description-closed.tags-closed',
  };
  assert.ok(validateHeatmapEvent(event, { now }));
  assert.ok(
    validateHeatmapEvent(
      {
        ...event,
        viewport: 'medium',
        state: 'slide-1.description-open.tags-closed',
      },
      { now }
    )
  );
  assert.ok(
    validateHeatmapEvent(
      {
        ...event,
        viewport: 'extra-wide',
        state: 'slide-0.description-closed.tags-open',
      },
      { now }
    )
  );
  assert.throws(
    () => validateHeatmapEvent({ ...event, viewport: 'wide' }, { now }),
    TypeError
  );
  assert.throws(
    () =>
      validateHeatmapEvent(
        {
          ...event,
          target: 'carousel.next',
          viewport: 'extra-wide',
          state: 'slide-4',
        },
        { now }
      ),
    TypeError
  );
  assert.ok(
    validateHeatmapEvent(
      {
        ...event,
        target: 'carousel.next',
        viewport: 'extra-wide',
        state: 'slide-1',
      },
      { now }
    )
  );
});

test('report filters accept only fixed aggregate query shapes', () => {
  assert.deepEqual(
    validateReportFilters({ mode: 'overview', range: '7d', viewport: 'all' }),
    { mode: 'overview', range: '7d', viewport: 'all' }
  );
  assert.deepEqual(
    validateReportFilters({
      mode: 'page',
      page: '/projects/',
      range: '90d',
      viewport: 'wide',
    }),
    { mode: 'page', range: '90d', viewport: 'wide', page: '/projects/' }
  );
  for (const input of [
    { mode: 'raw', range: '7d', viewport: 'all' },
    { mode: 'overview', range: '365d', viewport: 'all' },
    { mode: 'overview', range: '7d', viewport: 'mobile' },
    { mode: 'overview', range: '7d', viewport: 'all', page: '/' },
    { mode: 'page', range: '30d', viewport: 'all' },
    { mode: 'page', range: '30d', viewport: 'all', page: '/insights/' },
    { mode: 'overview', range: '7d', viewport: 'all', sql: 'SELECT *' },
    null,
    [],
  ])
    assert.throws(() => validateReportFilters(input), TypeError);
});

test('UTC report windows include exactly N calendar dates through injected now', () => {
  assert.deepEqual(getReportWindow('7d', now), {
    start: '2026-09-28T00:00:00.000Z',
    end: '2026-10-04T12:34:56.000Z',
    days: 7,
  });
  assert.equal(getReportWindow('30d', now).start, '2026-09-05T00:00:00.000Z');
  assert.equal(getReportWindow('90d', now).start, '2026-07-07T00:00:00.000Z');
  assert.equal(
    getReportWindow('7d', Date.parse('2026-03-01T00:00:00Z')).start,
    '2026-02-23T00:00:00.000Z'
  );
  assert.throws(() => getReportWindow('1d', now), TypeError);
  assert.throws(() => getReportWindow('7d', NaN), TypeError);
});
