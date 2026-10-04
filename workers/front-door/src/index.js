import {
  isPrivateHeatmapPath,
  privateResponse,
} from '../../../shared/heatmap-private.js';
import manifest from '../../../src/data/route-manifest.json' with { type: 'json' };
import {
  negotiateMarkdown,
  wantsMarkdown,
  isHtmlPagePath,
} from './markdown.js';
import {
  buildTarget,
  canonicalTrailingSlashRedirect,
  matchRoute,
  preventHtmlEdgeCache,
} from './routing.js';

const FETCH_TIMEOUT_MS = 30_000;

/**
 * @param {Request} request
 * @param {string} target
 */
async function fetchUpstream(request, target) {
  const headers = new Headers(request.headers);
  headers.delete('host');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(new Request(target, request), {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function upstreamErrorStatus(status) {
  if (status === 504) return 504;
  if (status >= 500) return 502;
  return null;
}

function upstreamFailureResponse(request, status) {
  const message = status === 504 ? 'Gateway Timeout' : 'Bad Gateway';
  return new Response(request.method === 'HEAD' ? null : message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'CDN-Cache-Control': 'no-store',
      'Cloudflare-CDN-Cache-Control': 'no-store',
    },
  });
}

export default {
  /**
   * @param {Request} request
   * @param {{ AI: Ai }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const redirectPath = canonicalTrailingSlashRedirect(url.pathname, manifest);
    if (redirectPath) {
      url.pathname = redirectPath;
      return new Response(null, {
        status: 308,
        headers: {
          'CDN-Cache-Control': 'no-store',
          Location: url.toString(),
          'Cache-Control': 'no-store',
          'Cloudflare-CDN-Cache-Control': 'no-store',
        },
      });
    }

    const route = matchRoute(url.pathname, manifest);
    if (!route) {
      const response = new Response('Not Found', { status: 404 });
      return isPrivateHeatmapPath(url.pathname)
        ? privateResponse(response, request)
        : response;
    }

    const target = buildTarget(request.url, route);
    let upstream;
    try {
      upstream = await fetchUpstream(request, target);
    } catch (error) {
      const status =
        error instanceof Error && error.name === 'AbortError' ? 504 : 502;
      return upstreamFailureResponse(request, status);
    }

    const errorStatus = upstreamErrorStatus(upstream.status);
    if (errorStatus) {
      return upstreamFailureResponse(request, errorStatus);
    }

    if (isPrivateHeatmapPath(url.pathname))
      return privateResponse(upstream, request);

    if (wantsMarkdown(request) && isHtmlPagePath(url.pathname)) {
      return negotiateMarkdown(request, upstream, env);
    }

    return preventHtmlEdgeCache(upstream);
  },
};
