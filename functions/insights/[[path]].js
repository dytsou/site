import {
  requireHeatmapOwner,
  privateMethodResponse,
  privateResponse,
} from '../_shared/access.js';

export async function onRequest({ request, env, next }) {
  const denied = await requireHeatmapOwner(request, env);
  if (denied) return denied;
  const method = privateMethodResponse(request);
  if (method) return method;
  try {
    return privateResponse(await next(), request);
  } catch {
    console.error('heatmap_private_page_unavailable');
    return privateResponse(
      new Response('Service unavailable', { status: 503 }),
      request
    );
  }
}
