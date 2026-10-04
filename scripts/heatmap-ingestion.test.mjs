import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/api/click-events.js';
import { MAX_EVENT_BYTES } from '../shared/heatmap-contract.js';
import {
  HEATMAP_COLUMNS,
  HEATMAP_DATASET,
  toHeatmapDataPoint,
} from '../functions/_shared/heatmap-storage.js';

const origin = 'https://dy.tsou.me';
const origins = JSON.stringify([origin, 'https://dy-tsou-me.pages.dev']);
function pointer() {
  return {
    version: 1,
    page: '/',
    target: 'home.projects',
    layout: 'home-v1',
    build: 'abcdef1234567',
    viewport: 'narrow',
    theme: 'light',
    state: 'default',
    kind: 'pointer',
    time: Date.now(),
    x: 0,
    y: 15,
    pageX: 40,
    pageY: 200,
  };
}
function request(body = JSON.stringify(pointer()), options = {}) {
  return new Request('https://dy-tsou-me.pages.dev/api/click-events', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body,
    ...options,
  });
}
function context(req, overrides = {}) {
  const writes = [];
  return {
    writes,
    request: req,
    env: {
      HEATMAP_PUBLIC_ORIGINS: origins,
      CLICK_EVENTS: { writeDataPoint: (point) => writes.push(point) },
      ...overrides,
    },
  };
}
async function assertResponse(response, status) {
  assert.equal(response.status, status);
  for (const header of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Cloudflare-CDN-Cache-Control',
  ])
    assert.equal(response.headers.get(header), 'no-store');
  const body = await response.text();
  assert.equal(
    body,
    status === 204
      ? ''
      : status >= 500
        ? 'Service unavailable'
        : 'Invalid request'
  );
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
}

test('accepted pointer stores only the portable mapped dimensions exactly once', async () => {
  const event = pointer();
  const ctx = context(request(JSON.stringify(event)));
  await assertResponse(await onRequest(ctx), 204);
  assert.equal(HEATMAP_DATASET, 'site_click_events');
  assert.deepEqual(ctx.writes, [
    {
      indexes: ['/'],
      blobs: [
        'home.projects',
        'home-v1',
        'abcdef1234567',
        'narrow',
        'light',
        'default',
        'pointer',
      ],
      doubles: [1, event.time, 0, 15, 40, 200],
    },
  ]);
  assert.deepEqual(toHeatmapDataPoint(event), ctx.writes[0]);
  assert.equal(HEATMAP_COLUMNS.page, 'index1');
  assert.equal(HEATMAP_COLUMNS.target, 'blob1');
  assert.equal(HEATMAP_COLUMNS.kind, 'blob7');
  assert.equal(HEATMAP_COLUMNS.time, 'double2');
  assert.equal(HEATMAP_COLUMNS.pageY, 'double6');
});

test('keyboard events have sentinel spatial dimensions and production Pages origin passes', async () => {
  const { x, y, pageX, pageY, ...base } = pointer();
  const event = { ...base, kind: 'keyboard' };
  const ctx = context(
    request(JSON.stringify(event), {
      headers: {
        Origin: 'https://dy-tsou-me.pages.dev',
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  );
  await assertResponse(await onRequest(ctx), 204);
  assert.equal(ctx.writes.length, 1);
  assert.deepEqual(ctx.writes[0].doubles, [1, event.time, -1, -1, -1, -1]);
});

test('unapproved, malformed, missing and preview origins never write', async () => {
  for (const value of [
    null,
    'null',
    'https://unrelated.example',
    'https://preview.dy-tsou-me.pages.dev',
    `${origin}/`,
    `${origin}/?secret=1`,
    'http://dy.tsou.me',
  ]) {
    const headers = { 'Content-Type': 'application/json' };
    if (value !== null) headers.Origin = value;
    const ctx = context(request(undefined, { headers }));
    await assertResponse(await onRequest(ctx), 403);
    assert.equal(ctx.writes.length, 0);
  }
});

test('wrong method and media type never write', async () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']) {
    const ctx = context(request(null, { method }));
    const response = await onRequest(ctx);
    assert.equal(response.headers.get('Allow'), 'POST');
    await assertResponse(response, 405);
    assert.equal(ctx.writes.length, 0);
  }
  const ctx = context(
    request(undefined, {
      headers: { Origin: origin, 'Content-Type': 'text/plain' },
    })
  );
  await assertResponse(await onRequest(ctx), 415);
  assert.equal(ctx.writes.length, 0);
});

test('invalid JSON, fields, paths, targets, states and coordinates never write', async () => {
  const event = pointer();
  for (const body of [
    '',
    '{',
    'null',
    '[]',
    JSON.stringify([event]),
    ...[
      { ...event, visitorId: 'secret-visitor' },
      { ...event, cookie: 'secret-cookie' },
      { ...event, text: 'secret-form' },
      { ...event, page: '/?secret=1' },
      { ...event, page: '/insights/' },
      { ...event, target: 'contact.email' },
      { ...event, layout: 'home-v99' },
      { ...event, state: 'secret-state' },
      { ...event, x: 16 },
      { ...event, y: 0.5 },
      { ...event, pageX: 100_001 },
      { ...event, time: 0 },
      { ...event, kind: 'keyboard' },
    ].map((value) => JSON.stringify(value)),
  ]) {
    const ctx = context(request(body));
    await assertResponse(await onRequest(ctx), 400);
    assert.equal(ctx.writes.length, 0);
  }
});

test('stream limit counts bytes, accepts 2048, cancels oversized input even without honest Content-Length', async () => {
  const json = JSON.stringify(pointer());
  const exact = json.padEnd(MAX_EVENT_BYTES, ' ');
  const accepted = context(request(exact));
  await assertResponse(await onRequest(accepted), 204);
  assert.equal(accepted.writes.length, 1);
  for (const length of [null, '1', '2048']) {
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(exact));
        controller.enqueue(new TextEncoder().encode('é'));
      },
      cancel() {
        cancelled = true;
      },
    });
    const headers = { Origin: origin, 'Content-Type': 'application/json' };
    if (length !== null) headers['Content-Length'] = length;
    const ctx = context(request(stream, { headers, duplex: 'half' }));
    await assertResponse(await onRequest(ctx), 413);
    assert.equal(ctx.writes.length, 0);
    assert.equal(cancelled, true);
  }
  const ctx = context(
    request(json, {
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'Content-Length': '2049',
      },
    })
  );
  await assertResponse(await onRequest(ctx), 413);
  assert.equal(ctx.writes.length, 0);
});

test('stream errors and invalid UTF-8 fail generically without writes', async () => {
  const streams = [
    new ReadableStream({
      start(controller) {
        controller.error(new Error('secret-stream'));
      },
    }),
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([255]));
        controller.close();
      },
    }),
  ];
  for (const stream of streams) {
    const ctx = context(request(stream, { duplex: 'half' }));
    await assertResponse(await onRequest(ctx), 400);
    assert.equal(ctx.writes.length, 0);
  }
});

test('unconfigured origins, unavailable binding and synchronous write errors fail closed', async (t) => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  for (const config of [
    undefined,
    '',
    'bad-json',
    '[]',
    JSON.stringify(['*']),
    JSON.stringify([`${origin}/path`]),
  ]) {
    const ctx = context(request(), { HEATMAP_PUBLIC_ORIGINS: config });
    await assertResponse(await onRequest(ctx), 503);
    assert.equal(ctx.writes.length, 0);
  }
  for (const binding of [undefined, null, {}]) {
    const ctx = context(request(), { CLICK_EVENTS: binding });
    await assertResponse(await onRequest(ctx), 503);
    assert.equal(ctx.writes.length, 0);
  }
  let writes = 0;
  const ctx = context(request(), {
    CLICK_EVENTS: {
      writeDataPoint() {
        writes++;
        throw new Error('secret-upstream');
      },
    },
  });
  await assertResponse(await onRequest(ctx), 503);
  assert.equal(writes, 1);
  assert.equal(JSON.stringify(logs).includes('secret'), false);
});
