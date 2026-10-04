import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../src/index.js';
import { onRequest } from '../../../functions/api/click-events.js';

test('canonical ingestion preserves method, body and Origin through the Pages proxy', async (t) => {
  const body = '{"version":1,"target":"home.projects"}';
  let received;
  t.mock.method(globalThis, 'fetch', async (target, init) => {
    received = new Request(target, init);
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  });
  const response = await worker.fetch(
    new Request('https://dy.tsou.me/api/click-events', {
      method: 'POST',
      body,
      headers: {
        Origin: 'https://dy.tsou.me',
        'Content-Type': 'application/json',
      },
    }),
    {}
  );
  assert.equal(response.status, 204);
  assert.equal(received.url, 'https://dy-tsou-me.pages.dev/api/click-events');
  assert.equal(received.method, 'POST');
  assert.equal(received.headers.get('Origin'), 'https://dy.tsou.me');
  assert.equal(received.headers.get('Content-Type'), 'application/json');
  assert.equal(await received.text(), body);
});

test('ingestion proxy failures stay generic and non-cacheable', async (t) => {
  for (const outcome of ['exception', 503]) {
    t.mock.method(globalThis, 'fetch', async () => {
      if (outcome === 'exception') throw new Error('secret-upstream');
      return new Response('secret-upstream', { status: outcome });
    });
    const response = await worker.fetch(
      new Request('https://dy.tsou.me/api/click-events', {
        method: 'POST',
        body: '{}',
      }),
      {}
    );
    assert.equal(response.status, 502);
    assert.equal(await response.text(), 'Bad Gateway');
    for (const header of [
      'Cache-Control',
      'CDN-Cache-Control',
      'Cloudflare-CDN-Cache-Control',
    ])
      assert.equal(response.headers.get(header), 'no-store');
  }
});

test('canonical body and allowed Origin reach the real ingestion handler; unrelated Origin fails', async (t) => {
  const event = {
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
    x: 2,
    y: 3,
    pageX: 100,
    pageY: 200,
  };
  const writes = [];
  t.mock.method(globalThis, 'fetch', (target, init) =>
    onRequest({
      request: new Request(target, init),
      env: {
        HEATMAP_PUBLIC_ORIGINS:
          '["https://dy.tsou.me", "https://dy-tsou-me.pages.dev"]',
        CLICK_EVENTS: { writeDataPoint: (point) => writes.push(point) },
      },
    })
  );
  for (const [origin, status] of [
    ['https://dy.tsou.me', 204],
    ['https://unrelated.example', 403],
  ]) {
    const response = await worker.fetch(
      new Request('https://dy.tsou.me/api/click-events', {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          Cookie: 'secret-cookie',
        },
      }),
      {}
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].indexes, ['/']);
  assert.deepEqual(writes[0].doubles, [1, event.time, 2, 3, 100, 200]);
  assert.equal(JSON.stringify(writes).includes('secret'), false);
});
