export const PRIVATE_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
});

export function isPrivateHeatmapPath(path) {
  try {
    path = decodeURIComponent(path);
  } catch {
    /* Invalid encodings cannot identify an asset. */
  }
  return (
    path === '/insights' ||
    path.startsWith('/insights/') ||
    path === '/api/insights' ||
    path.startsWith('/api/insights/')
  );
}

export function privateResponse(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(PRIVATE_HEADERS))
    headers.set(name, value);
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
