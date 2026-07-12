import manifest from '../../../src/data/route-manifest.json';
import {
  negotiateMarkdown,
  wantsMarkdown,
  isHtmlPagePath,
} from './markdown.js';
import { buildTarget, matchRoute, preventHtmlEdgeCache } from './routing.js';

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
    return await fetch(target, {
      method: request.method,
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

export default {
  /**
   * @param {Request} request
   * @param {{ AI: Ai }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = matchRoute(url.pathname, manifest);
    if (!route) {
      return new Response('Not Found', { status: 404 });
    }

    const target = buildTarget(request.url, route);
    let upstream;
    try {
      upstream = await fetchUpstream(request, target);
    } catch (error) {
      const status =
        error instanceof Error && error.name === 'AbortError' ? 504 : 502;
      return new Response(status === 504 ? 'Gateway Timeout' : 'Bad Gateway', {
        status,
      });
    }

    const errorStatus = upstreamErrorStatus(upstream.status);
    if (errorStatus) {
      return new Response(
        errorStatus === 504 ? 'Gateway Timeout' : 'Bad Gateway',
        {
          status: errorStatus,
        }
      );
    }

    if (wantsMarkdown(request) && isHtmlPagePath(url.pathname)) {
      return negotiateMarkdown(request, upstream, env);
    }

    return preventHtmlEdgeCache(upstream);
  },
};
