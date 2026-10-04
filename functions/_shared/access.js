import { createRemoteJWKSet, customFetch, jwtVerify } from 'jose';

import { privateResponse } from '../../shared/heatmap-private.js';
export {
  PRIVATE_HEADERS,
  isPrivateHeatmapPath,
  privateResponse,
} from '../../shared/heatmap-private.js';

// Bound streams even when upstream omits Content-Length. The abort signal
// covers receiving headers AND consuming the body, including a stalled stream.
export async function readBoundedJson(response, { maxBytes, signal }) {
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get('Content-Length')) > maxBytes
  )
    throw new Error('Upstream unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  let rejectAbort;
  const aborted = new Promise((_, reject) => {
    rejectAbort = reject;
  });
  const onAbort = () => {
    rejectAbort(new Error('Upstream timeout'));
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener('abort', onAbort, { once: true });
  try {
    if (signal.aborted) throw new Error('Upstream timeout');
    while (true) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Upstream too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    signal.removeEventListener('abort', onAbort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function accessConfiguration(env) {
  const issuer = env.HEATMAP_ACCESS_ISSUER;
  const audience = env.HEATMAP_ACCESS_AUD;
  const value = env.HEATMAP_OWNER_EMAILS;
  if (
    typeof issuer !== 'string' ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) ||
    typeof audience !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(audience) ||
    typeof value !== 'string' ||
    value.length > 2048
  )
    throw new Error('Access configuration unavailable');
  const owners = JSON.parse(value);
  if (
    !Array.isArray(owners) ||
    !owners.length ||
    owners.length > 10 ||
    !owners.every(
      (email) =>
        typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        email.length <= 254
    )
  )
    throw new Error('Access configuration unavailable');
  return { issuer, audience, owners };
}

const jwksResolvers = new Map();
function ownerKeys(issuer) {
  if (jwksResolvers.has(issuer)) return jwksResolvers.get(issuer);
  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), {
    timeoutDuration: 3000,
    cacheMaxAge: 300_000,
    [customFetch]: async (url, options) => {
      const response = await fetch(url, options);
      const json = await readBoundedJson(response, {
        maxBytes: 65_536,
        signal: options.signal,
      });
      if (
        !Array.isArray(json.keys) ||
        !json.keys.length ||
        json.keys.length > 20
      )
        throw new Error('Invalid JWKS');
      return Response.json(json);
    },
  });
  if (jwksResolvers.size >= 4)
    jwksResolvers.delete(jwksResolvers.keys().next().value);
  jwksResolvers.set(issuer, jwks);
  return jwks;
}

/** Origin boundary: no cookie, identity header, local fixture or dev bypass. */
export async function requireHeatmapOwner(request, env) {
  let config;
  try {
    config = accessConfiguration(env);
  } catch {
    console.error('heatmap_access_configuration_unavailable');
    return privateResponse(new Response('Forbidden', { status: 403 }), request);
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192)
    return privateResponse(new Response('Forbidden', { status: 403 }), request);
  try {
    const jwks = ownerKeys(config.issuer);
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      issuer: config.issuer,
      audience: config.audience,
      requiredClaims: ['exp', 'iat', 'email'],
      clockTolerance: 0,
    });
    if (
      typeof payload.email !== 'string' ||
      !config.owners.includes(payload.email) ||
      !Number.isSafeInteger(payload.iat) ||
      payload.iat > Math.floor(Date.now() / 1000)
    )
      throw new Error('Invalid owner');
    return null;
  } catch {
    console.error('heatmap_access_denied');
    return privateResponse(new Response('Forbidden', { status: 403 }), request);
  }
}

export function privateMethodResponse(request) {
  return ['GET', 'HEAD'].includes(request.method)
    ? null
    : privateResponse(
        new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'GET, HEAD' },
        }),
        request
      );
}
