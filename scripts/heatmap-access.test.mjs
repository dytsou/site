import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { onRequest as middleware } from '../functions/_middleware.js';
import { onRequest as page } from '../functions/insights/[[path]].js';
import { onRequest as api } from '../functions/api/insights/report.js';
import worker from '../workers/front-door/src/index.js';

const issuer = 'https://owner.cloudflareaccess.com';
const env = {
  HEATMAP_ACCESS_ISSUER: issuer,
  HEATMAP_ACCESS_AUD: 'report-audience',
  HEATMAP_OWNER_EMAILS: '["owner@example.com"]',
};
const keys = await generateKeyPair('RS256');
const wrongKeys = await generateKeyPair('RS256');
const jwk = {
  ...(await exportJWK(keys.publicKey)),
  kid: 'owner-key',
  alg: 'RS256',
  use: 'sig',
};
async function token(overrides = {}, key = keys.privateKey) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: 'owner@example.com',
    iss: issuer,
    aud: 'report-audience',
    iat: now,
    exp: now + 300,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'owner-key' })
    .sign(key);
}
function request(path, jwt, method = 'GET') {
  return new Request(`https://dy.tsou.me${path}`, {
    method,
    headers: {
      Accept: 'text/markdown',
      ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}),
    },
  });
}
function noStore(response) {
  for (const h of [
    'Cache-Control',
    'CDN-Cache-Control',
    'Cloudflare-CDN-Cache-Control',
  ])
    assert.equal(response.headers.get(h), 'no-store');
}
function jwks(t) {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(String(url), `${issuer}/cdn-cgi/access/certs`);
    return Response.json({ keys: [jwk] });
  });
}

test('signed owner reaches HTML through actual middleware and route chain with private headers', async (t) => {
  jwks(t);
  for (const path of [
    '/insights',
    '/insights/',
    '/insights/index.html',
    '/insights/child/index.html',
  ]) {
    let served = 0;
    const context = {
      request: request(path, await token()),
      env,
      next: async () => {
        served++;
        return new Response('<html>private</html>', {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public',
            'X-Origin': 'preserved',
          },
        });
      },
    };
    const response = await middleware({
      ...context,
      next: () => page(context),
    });
    assert.equal(response.status, 200);
    assert.equal(served, 1);
    assert.equal(response.headers.get('X-Origin'), 'preserved');
    noStore(response);
    assert.equal(await response.text(), '<html>private</html>');
  }
});

test('missing config/header and forged, expired, wrong issuer/audience/email, malformed tokens fail closed independently', async (t) => {
  jwks(t);
  const cases = [
    [null, env],
    ['bad.jwt', env],
    [await token({ exp: 1 }), env],
    [await token({ iss: 'https://evil.example' }), env],
    [await token({ aud: 'other' }), env],
    [await token({ email: 'other@example.com' }), env],
    [await token({}, wrongKeys.privateKey), env],
    [await token({ exp: undefined }), env],
    [await token(), {}],
  ];
  for (const handler of [middleware, page, api])
    for (const [jwt, config] of cases) {
      const response = await handler({
        request: request(
          handler === api
            ? '/api/insights/report?mode=overview&range=7d&viewport=all'
            : '/insights/index.html',
          jwt
        ),
        env: config,
        next: () => {
          throw new Error('private origin reached');
        },
      });
      assert.equal(response.status, 403);
      noStore(response);
      assert.doesNotMatch(
        await response.text(),
        /owner@example|report-audience/
      );
    }
});

test('HEAD authenticates and omits bodies; unsupported methods never query', async (t) => {
  jwks(t);
  for (const handler of [middleware, page, api]) {
    const response = await handler({
      request: request('/insights/', await token(), 'HEAD'),
      env,
      next: async () => new Response('private'),
    });
    assert.equal(await response.text(), '');
    noStore(response);
    const rejected = await handler({
      request: request('/insights/', await token(), 'POST'),
      env,
      next: () => {
        throw new Error('origin reached');
      },
    });
    assert.equal(rejected.status, 405);
    noStore(rejected);
  }
});

test('front-door private HTML/data bypass conversion and preserve no-store including errors and HEAD', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response('private', {
        headers: { 'Content-Type': 'text/html', 'X-Origin': 'preserved' },
      })
  );
  for (const path of [
    '/insights',
    '/insights/',
    '/insights/index.html',
    '/insights/child/',
    '/api/insights/report',
  ]) {
    const response = await worker.fetch(request(path), {
      AI: {
        toMarkdown: () => {
          throw new Error('private conversion');
        },
      },
    });
    noStore(response);
    if (response.status === 200) {
      assert.equal(await response.text(), 'private');
      assert.equal(response.headers.get('X-Origin'), 'preserved');
    }
  }
  const head = await worker.fetch(request('/insights/', null, 'HEAD'), {});
  assert.equal(await head.text(), '');
  noStore(head);
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('secret upstream', { status: 503 })
  );
  noStore(await worker.fetch(request('/api/insights/report'), {}));
});

test('public middleware still negotiates Markdown and collection remains public', async () => {
  const response = await middleware({
    request: request('/'),
    env: { AI: { toMarkdown: async () => [{ data: '# Public' }] } },
    next: async () =>
      new Response('<html>public</html>', {
        headers: { 'Content-Type': 'text/html' },
      }),
  });
  assert.equal(await response.text(), '# Public');
});

test('allowed signed owner reads actual API through Pages chain; failed reads return unavailable without credentials', async (t) => {
  const reportEnv = {
    ...env,
    HEATMAP_ACCOUNT_ID: 'a'.repeat(32),
    HEATMAP_READ_TOKEN: 'secret-read-token',
  };
  let sqlCalls = 0;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (String(url).includes('/certs')) return Response.json({ keys: [jwk] });
    sqlCalls++;
    assert.equal(init.headers.Authorization, 'Bearer secret-read-token');
    const data = init.body.includes(' AS page')
      ? [{ page: '/', count: '3', observed: '2', maxSample: '2' }]
      : [
          {
            date: new Date().toISOString().slice(0, 10),
            count: '3',
            observed: '2',
            maxSample: '2',
          },
        ];
    return Response.json({ data, rows: data.length });
  });
  const context = {
    request: request(
      '/api/insights/report?mode=overview&range=7d&viewport=all',
      await token()
    ),
    env: reportEnv,
  };
  const response = await middleware({ ...context, next: () => api(context) });
  assert.equal(response.status, 200);
  noStore(response);
  assert.equal((await response.json()).total, 3);
  assert.equal(sqlCalls, 2);
  t.mock.method(
    globalThis,
    'fetch',
    async () => new Response('secret failure', { status: 503 })
  );
  const unavailable = await api(context);
  assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { status: 'unavailable' });
  noStore(unavailable);
  for (const query of [
    'mode=page&page=%27DROP&range=7d&viewport=all',
    'mode=overview&range=7d&range=90d&viewport=all',
    'mode=overview&range=7d&viewport=all&sql=SELECT',
  ]) {
    const invalid = await api({
      ...context,
      request: request(`/api/insights/report?${query}`, await token()),
    });
    assert.equal(invalid.status, 400);
    noStore(invalid);
  }
});

test('every Access setting is required; future issuance and unsigned/HS256 tokens deny', async (t) => {
  jwks(t);
  for (const name of Object.keys(env)) {
    const incomplete = { ...env };
    delete incomplete[name];
    const response = await page({
      request: request('/insights/', await token()),
      env: incomplete,
      next: () => {
        throw new Error('origin reached');
      },
    });
    assert.equal(response.status, 403);
  }
  for (const config of [
    { ...env, HEATMAP_OWNER_EMAILS: '[]' },
    { ...env, HEATMAP_ACCESS_ISSUER: 'http://owner.cloudflareaccess.com' },
    { ...env, HEATMAP_OWNER_EMAILS: 'bad-json' },
  ])
    assert.equal(
      (
        await page({
          request: request('/insights/', await token()),
          env: config,
        })
      ).status,
      403
    );
  const hsToken = await new SignJWT({
    email: 'owner@example.com',
    iss: issuer,
    aud: 'report-audience',
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode('a'.repeat(32)));
  for (const jwt of [
    await token({ iat: Math.floor(Date.now() / 1000) + 300 }),
    hsToken,
    'eyJhbGciOiJub25lIn0.eyJlbWFpbCI6Im93bmVyQGV4YW1wbGUuY29tIn0.',
    'a'.repeat(8193),
  ])
    assert.equal(
      (await page({ request: request('/insights/', jwt), env })).status,
      403
    );
});

test('fresh JWKS failures and invalid configuration never fall through to assets', async (t) => {
  for (const [index, response] of [
    new Response('bad-json'),
    Response.json({ keys: [] }),
    Response.json({ keys: [await exportJWK(wrongKeys.publicKey)] }),
    new Response('secret', { status: 503 }),
  ].entries()) {
    const testIssuer = `https://fail-${index}.cloudflareaccess.com`;
    t.mock.method(globalThis, 'fetch', async () => response);
    const result = await middleware({
      request: request('/insights/', await token({ iss: testIssuer })),
      env: { ...env, HEATMAP_ACCESS_ISSUER: testIssuer },
      next: () => {
        throw new Error('origin reached');
      },
    });
    assert.equal(result.status, 403);
    noStore(result);
  }
});
