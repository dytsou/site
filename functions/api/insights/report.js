import {
  requireHeatmapOwner,
  privateMethodResponse,
  privateResponse,
} from '../../_shared/access.js';
import { readHeatmapReport } from '../../_shared/heatmap-report.js';
import { validateReportFilters } from '../../../shared/heatmap-contract.js';

export async function onRequest({ request, env }) {
  const denied = await requireHeatmapOwner(request, env);
  if (denied) return denied;
  const method = privateMethodResponse(request);
  if (method) return method;
  let filters;
  try {
    const params = new URL(request.url).searchParams;
    if (
      params.size > 4 ||
      [...params.keys()].some((key) => params.getAll(key).length !== 1)
    )
      throw new TypeError('Invalid filters');
    filters = validateReportFilters(Object.fromEntries(params));
  } catch {
    return privateResponse(
      Response.json({ status: 'invalid' }, { status: 400 }),
      request
    );
  }
  // HEAD proves Access/method/filter boundaries without querying private data.
  if (request.method === 'HEAD')
    return privateResponse(
      new Response(null, { headers: { 'Content-Type': 'application/json' } }),
      request
    );
  try {
    return privateResponse(
      Response.json(await readHeatmapReport(filters, env)),
      request
    );
  } catch {
    console.error('heatmap_report_unavailable');
    return privateResponse(
      Response.json({ status: 'unavailable' }, { status: 503 }),
      request
    );
  }
}
