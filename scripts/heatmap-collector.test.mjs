import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildHeatmapEvent,
  installHeatmapCollector,
} from '../src/scripts/client/click-heatmap.ts';
import {
  HEATMAP_PROJECTS,
  getHeatmapTarget,
  validateHeatmapEvent,
} from '../shared/heatmap-contract.js';

import { PROJECTS_CONTENTS } from '../src/components/contents/Projects.generated.ts';
import {
  FOOTER_QUICK_LINKS,
  FOOTER_SOCIAL_LINKS,
} from '../src/data/footer-links.ts';
import { experiences } from '../src/data/experience-content.ts';

const now = Date.parse('2026-10-04T12:34:56Z');
class Element {
  constructor(tagName, dataset = {}, parentElement = null) {
    this.tagName = tagName;
    this.dataset = dataset;
    this.parentElement = parentElement;
    this.rect = { left: 10, top: 20, width: 100, height: 40 };
    this.attributes = {};
    this.classList = { contains: (value) => value === 'light' };
  }
  *ancestors() {
    yield this;
    if (this.parentElement) yield* this.parentElement.ancestors();
  }
  closest(selector) {
    for (const node of this.ancestors()) {
      if (selector === '[data-heatmap-target]' && node.dataset.heatmapTarget)
        return node;
      if (selector === '[data-heatmap-state]' && node.dataset.heatmapState)
        return node;
      if (selector === '[data-heatmap-cards]' && node.dataset.heatmapCards)
        return node;
      if (
        selector === '[inert], [hidden], [aria-hidden="true"]' &&
        (node.attributes.inert ||
          node.attributes.hidden ||
          node.attributes['aria-hidden'] === 'true')
      )
        return node;
    }
    return null;
  }
  matches(selector) {
    return (
      selector === 'a[href], button' && ['A', 'BUTTON'].includes(this.tagName)
    );
  }
  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
  getBoundingClientRect() {
    return this.rect;
  }
}
function fixture({
  path = '/',
  search = '',
  width = 390,
  target = 'home.projects',
  state = 'default',
} = {}) {
  const root = new Element('HTML', {
    heatmapPage: path,
    heatmapLayout: path === '/projects/' ? 'projects-v1' : 'home-v1',
    heatmapBuild: 'abcdef1234567',
  });
  const control = new Element(
    'A',
    { heatmapTarget: target, heatmapState: state },
    root
  );
  const icon = new Element('svg', {}, control);
  const listeners = new Map();
  const doc = {
    documentElement: root,
    addEventListener: (name, listener, options) =>
      listeners.set(name, { listener, options }),
    removeEventListener: (name) => listeners.delete(name),
  };
  const requests = [];
  const win = {
    location: { pathname: path, search },
    innerWidth: width,
    fetch: (...args) => {
      requests.push(args);
      return Promise.resolve({});
    },
  };
  const click = {
    isTrusted: true,
    target: icon,
    detail: 1,
    button: 0,
    clientX: 60,
    clientY: 40,
    pageX: 60.8,
    pageY: 400.2,
  };
  return { root, control, icon, doc, win, click, requests, listeners };
}

test('nested trusted pointer activation yields only bounded contract fields', () => {
  const f = fixture();
  const event = buildHeatmapEvent(f.click, f.doc, f.win, now);
  assert.deepEqual(event, {
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
    x: 8,
    y: 8,
    pageX: 61,
    pageY: 400,
  });
  assert.deepEqual(validateHeatmapEvent(event, { now }), event);
});

test('native keyboard click is target-only and does not send spatial coordinates', () => {
  const f = fixture();
  const event = buildHeatmapEvent({ ...f.click, detail: 0 }, f.doc, f.win, now);
  assert.equal(event.kind, 'keyboard');
  assert.deepEqual(
    Object.keys(event).filter((key) =>
      ['x', 'y', 'pageX', 'pageY'].includes(key)
    ),
    []
  );
  assert.deepEqual(validateHeatmapEvent(event, { now }), event);
});

test('scripted, unknown, non-control, disabled, inactive and malformed activations are skipped', () => {
  const f = fixture();
  assert.equal(
    buildHeatmapEvent({ ...f.click, isTrusted: false }, f.doc, f.win, now),
    null
  );
  assert.equal(
    buildHeatmapEvent({ ...f.click, button: 2 }, f.doc, f.win, now),
    null
  );
  f.control.dataset.heatmapTarget = 'arbitrary.text';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
  f.control.dataset.heatmapTarget = 'home.projects';
  f.control.tagName = 'DIV';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
  f.control.tagName = 'BUTTON';
  f.control.disabled = true;
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
  f.control.disabled = false;
  f.control.attributes.inert = true;
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
  delete f.control.attributes.inert;
  for (const change of [
    { clientX: NaN },
    { clientX: -1 },
    { pageY: 100001 },
    { pageX: -1 },
  ])
    assert.equal(
      buildHeatmapEvent({ ...f.click, ...change }, f.doc, f.win, now),
      null
    );
  f.root.dataset.heatmapBuild = 'not-a-build';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
});

test('private, query-preview and path/metadata mismatch never install a collector', () => {
  for (const options of [
    { path: '/insights/' },
    { search: '?heatmap-preview=1&private=secret' },
    { path: '/unknown/' },
  ]) {
    const f = fixture(options);
    assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
    installHeatmapCollector(f.doc, f.win);
    assert.equal(f.listeners.size, 0);
  }
  const f = fixture();
  f.win.location.pathname = '/contact/';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
});

test('capture sends once before state changes, omits credentials, keeps navigation usable on delivery failure', async () => {
  const f = fixture({ target: 'nav.menu', state: 'closed' });
  f.control.tagName = 'BUTTON';
  const cleanup = installHeatmapCollector(f.doc, f.win);
  const { listener, options } = f.listeners.get('click');
  assert.equal(options.capture, true);
  assert.equal(options.passive, true);
  listener(f.click);
  f.control.dataset.heatmapState = 'open';
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0][0], '/api/click-events');
  assert.equal(f.requests[0][1].credentials, 'omit');
  assert.equal(f.requests[0][1].keepalive, true);
  assert.equal(JSON.parse(f.requests[0][1].body).state, 'closed');
  assert.equal(f.click.defaultPrevented, undefined);
  f.win.fetch = () => Promise.reject(new Error('network'));
  assert.doesNotThrow(() => listener(f.click));
  await new Promise((resolve) => setImmediate(resolve));
  f.win.fetch = () => {
    throw new Error('unavailable');
  };
  assert.doesNotThrow(() => listener(f.click));
  cleanup();
  assert.equal(f.listeners.size, 0);
});

test('carousel and project state follows the actual rendered grouping and nearest state', () => {
  for (const [width, cards, slide] of [
    [639, 1, 3],
    [640, 2, 1],
    [1024, 3, 1],
    [1440, 4, 0],
  ]) {
    const f = fixture({
      path: '/projects/',
      width,
      target: 'project.vaehor.github',
      state: `slide-${slide}.description-open.tags-closed`,
    });
    f.root.dataset.heatmapCards = String(cards);
    assert.ok(buildHeatmapEvent(f.click, f.doc, f.win, now));
    f.root.dataset.heatmapCards = '99';
    assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
  }
  const f = fixture({
    path: '/projects/',
    width: 1440,
    target: 'carousel.next',
    state: 'slide-1',
  });
  f.control.tagName = 'BUTTON';
  f.root.dataset.heatmapCards = '4';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now).state, 'slide-1');
  f.control.dataset.heatmapState = 'slide-4';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now), null);
});

test('authored project source IDs and expanding footer/experience controls match the registry', () => {
  assert.deepEqual(
    HEATMAP_PROJECTS.map(({ sourceId }) => sourceId),
    PROJECTS_CONTENTS.map(({ id }) => id)
  );
  for (const project of HEATMAP_PROJECTS) {
    for (const action of ['github', 'description', 'tags'])
      assert.ok(
        getHeatmapTarget('/projects/', `project.${project.key}.${action}`)
      );
  }
  for (const link of [...FOOTER_QUICK_LINKS, ...FOOTER_SOCIAL_LINKS]) {
    const target = getHeatmapTarget('/', `footer.${link.heatmapKey}`);
    assert.ok(target);
    assert.ok(target.states.includes('expanded'));
  }
  for (const entry of experiences) {
    assert.ok(
      getHeatmapTarget(
        '/experiences/',
        `experience.${entry.heatmapKey}.details`
      )
    );
    if (entry.orgUrl)
      assert.ok(
        getHeatmapTarget(
          '/experiences/',
          `experience.${entry.heatmapKey}.organization`
        )
      );
    for (const post of entry.posts ?? [])
      assert.ok(
        getHeatmapTarget('/experiences/', `experience.${post.heatmapKey}`)
      );
  }
});

test('nearest authored ancestor state wins without reading arbitrary text or URL', () => {
  const f = fixture({ target: 'footer.github' });
  delete f.control.dataset.heatmapState;
  f.root.dataset.heatmapState = 'expanded';
  f.control.textContent = 'private content';
  f.control.href = 'https://example.com/?secret=visitor';
  const event = buildHeatmapEvent(f.click, f.doc, f.win, now);
  assert.equal(event.state, 'expanded');
  assert.ok(!JSON.stringify(event).includes('private'));
  assert.ok(!JSON.stringify(event).includes('secret'));
  f.control.dataset.heatmapState = 'default';
  assert.equal(buildHeatmapEvent(f.click, f.doc, f.win, now).state, 'default');
});
