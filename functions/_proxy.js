// Reverse-proxy for legacy subsites that used to live under dy.tsou.me.
//
// cal.tsou.me already hosts the calendar at its root (no /cal base path), so
// dy.tsou.me/cal/* is proxied there with the /cal prefix stripped.
export function buildTarget(requestUrl, { origin, stripPrefix = '' } = {}) {
  const url = new URL(requestUrl);
  let pathname = url.pathname;
  if (stripPrefix && pathname.startsWith(stripPrefix)) {
    pathname = pathname.slice(stripPrefix.length) || '/';
  }
  return origin + pathname + url.search;
}

export async function proxySubsite(context, options) {
  const target = buildTarget(context.request.url, options);
  const headers = new Headers(context.request.headers);
  headers.delete('host');
  return fetch(target, {
    method: context.request.method,
    headers,
    redirect: 'follow',
  });
}
