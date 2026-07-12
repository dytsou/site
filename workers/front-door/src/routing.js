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
