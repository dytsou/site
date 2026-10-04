import {
  isPrivateHeatmapPath,
  requireHeatmapOwner,
  privateMethodResponse,
  privateResponse,
} from './_shared/access.js';
import {
  wantsMarkdown,
  isHtmlPagePath,
  negotiateMarkdown,
} from '../shared/markdown-negotiation.mjs';

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  if (isPrivateHeatmapPath(pathname)) {
    const denied = await requireHeatmapOwner(context.request, context.env);
    if (denied) return denied;
    const method = privateMethodResponse(context.request);
    if (method) return method;
    try {
      return privateResponse(await context.next(), context.request);
    } catch {
      console.error('heatmap_private_route_unavailable');
      return privateResponse(
        new Response('Service unavailable', { status: 503 }),
        context.request
      );
    }
  }
  if (!wantsMarkdown(context.request)) {
    return context.next();
  }

  if (!isHtmlPagePath(pathname)) {
    return context.next();
  }

  const response = await context.next();
  return negotiateMarkdown(context.request, response, context.env);
}
