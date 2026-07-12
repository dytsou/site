/** @typedef {{ pathPrefix: string, backend: string, stripPrefix: string }} Route */

/**
 * @param {string} pathname
 * @param {string} prefix
 */
export function matchesPrefix(pathname, prefix) {
  if (prefix === '/') return true;
  if (pathname === prefix || pathname.startsWith(prefix)) return true;
  if (!prefix.endsWith('/') && pathname.startsWith(`${prefix}/`)) return true;
  if (prefix.endsWith('/') && pathname === prefix.slice(0, -1)) return true;
  return false;
}

/**
 * Longest matching pathPrefix wins; `/` is the fallback.
 * @param {string} pathname
 * @param {Route[]} manifest
 * @returns {Route | undefined}
 */
export function matchRoute(pathname, manifest) {
  const sorted = [...manifest].sort(
    (a, b) => b.pathPrefix.length - a.pathPrefix.length
  );
  return sorted.find((route) => matchesPrefix(pathname, route.pathPrefix));
}

/**
 * Cloudflare edge-caches HTML whose Cache-Control carries `public` (even with
 * `max-age=0, must-revalidate`), keyed by exact URL. That makes trailing-slash
 * variants (/cal vs /cal/) independent cache entries and pins stale deploys.
 * Force the edge to never store page HTML so the front door always revalidates
 * against the backend. Hashed assets (css/js/png) keep their edge cache. The
 * browser's own Cache-Control is untouched — Cloudflare consumes and strips
 * Cloudflare-CDN-Cache-Control before the response reaches the client.
 * @param {string} contentType
 */
export function isEdgeCacheableContent(contentType) {
  return !(contentType ?? '').includes('text/html');
}

/**
 * Returns a response that Cloudflare's edge will not cache when it carries HTML.
 * @param {Response} response
 * @returns {Response}
 */
export function preventHtmlEdgeCache(response) {
  if (isEdgeCacheableContent(response.headers.get('content-type') ?? '')) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * @param {string} requestUrl
 * @param {Route} route
 */
export function buildTarget(requestUrl, route) {
  const url = new URL(requestUrl);
  let pathname = url.pathname;
  const { stripPrefix } = route;
  if (stripPrefix && pathname.startsWith(stripPrefix)) {
    pathname = pathname.slice(stripPrefix.length) || '/';
  }
  const backend = route.backend.replace(/\/$/, '');
  return backend + pathname + url.search;
}
