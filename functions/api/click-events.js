import {
  MAX_EVENT_BYTES,
  validateHeatmapEvent,
} from '../../shared/heatmap-contract.js';
import { toHeatmapDataPoint } from '../_shared/heatmap-storage.js';

const noStore = {
  'Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
};

function response(status, headers = {}) {
  const body = status >= 500 ? 'Service unavailable' : 'Invalid request';
  return new Response(status === 204 ? null : body, {
    status,
    headers: { ...noStore, ...headers },
  });
}

/** @param {unknown} config @returns {string[]|null} */
function publicOrigins(config) {
  if (typeof config !== 'string' || config.length > 2048) return null;
  try {
    const values = JSON.parse(config);
    if (!Array.isArray(values) || values.length === 0 || values.length > 10)
      return null;
    if (
      !values.every((value) => {
        if (typeof value !== 'string') return false;
        const url = new URL(value);
        return url.protocol === 'https:' && url.origin === value;
      })
    )
      return null;
    return values;
  } catch {
    return null;
  }
}

class RequestTooLargeError extends Error {}

/** @param {Request} request */
async function readEvent(request) {
  const length = request.headers.get('Content-Length');
  if (length !== null && Number(length) > MAX_EVENT_BYTES)
    throw new RequestTooLargeError();
  if (!request.body) throw new TypeError('Missing body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let json = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_EVENT_BYTES) {
        throw new RequestTooLargeError();
      }
      json += decoder.decode(value, { stream: true });
    }
    json += decoder.decode();
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      // Stop consuming oversized uploads. Cancellation failures do not change
      // rejection or expose stream errors to the caller.
      await reader.cancel().catch(() => {});
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
  return validateHeatmapEvent(JSON.parse(json));
}

/**
 * Public, write-only route. Origin is checked against configured public site
 * origins because the canonical front door forwards to a pages.dev hostname.
 * No request headers, event data or exception details enter operational logs.
 */
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return response(405, { Allow: 'POST' });
  const origins = publicOrigins(env.HEATMAP_PUBLIC_ORIGINS);
  if (!origins) {
    console.error('heatmap_ingestion_configuration_unavailable');
    return response(503);
  }
  if (!origins.includes(request.headers.get('Origin'))) return response(403);
  const mediaType = request.headers
    .get('Content-Type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  if (mediaType !== 'application/json') return response(415);

  let event;
  try {
    event = await readEvent(request);
  } catch (error) {
    return response(error instanceof RequestTooLargeError ? 413 : 400);
  }
  if (typeof env.CLICK_EVENTS?.writeDataPoint !== 'function') {
    console.error('heatmap_ingestion_binding_unavailable');
    return response(503);
  }
  try {
    // This binding method is synchronous. One accepted event makes one call;
    // there is no background promise, retry or visitor-based deduplication.
    env.CLICK_EVENTS.writeDataPoint(toHeatmapDataPoint(event));
  } catch {
    console.error('heatmap_ingestion_write_failed');
    return response(503);
  }
  return response(204);
}
