import {
  requireHeatmapOwner,
  privateMethodResponse,
  privateResponse,
} from '../../_shared/access.js';
import { readHeatmapReport } from '../../_shared/heatmap-report.js';
import { validateReportFilters } from '../../../shared/heatmap-contract.js';

// Only fixed application messages may reach logs. Provider errors can contain
// response bodies, URLs or credentials, so never log the original exception.
const REPORT_FAILURE_MESSAGES = new Set([
  'Report configuration unavailable',
  'Invalid dataset',
  'Upstream unavailable',
  'Upstream timeout',
  'Upstream too large',
  'Invalid aggregate number',
  'Invalid aggregate dimension',
  'Invalid aggregate row',
  'Invalid aggregate page',
  'Invalid aggregate date',
  'Invalid aggregate layout',
  'Invalid or truncated aggregate result',
  'Truncated aggregate result',
  'Duplicate aggregate row',
  'Invalid weighted aggregate',
  'Inconsistent empty aggregate',
  'Report too large',
]);

function reportFailureReason(error) {
  if (!(error instanceof Error)) return 'Unexpected report failure';
  if (REPORT_FAILURE_MESSAGES.has(error.message)) return error.message;
  if (error instanceof SyntaxError) return 'Invalid upstream JSON';
  if (error.name === 'AbortError') return 'Upstream timeout';
  if (error instanceof TypeError) return 'Unexpected TypeError';
  if (error instanceof RangeError) return 'Unexpected RangeError';
  if (error instanceof ReferenceError) return 'Unexpected ReferenceError';
  if (error instanceof Error) return 'Unexpected Error';
  return 'Unexpected non-Error failure';
}

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
  let reportStage = 'read report';
  try {
    const report = await readHeatmapReport(filters, env, {
      onStage(stage) {
        reportStage = stage;
      },
    });
    reportStage = 'serialize report';
    const response = Response.json(report);
    reportStage = 'apply private response headers';
    return privateResponse(response, request);
  } catch (error) {
    console.error('heatmap_report_unavailable', {
      diagnostic: 'report-stage-v8',
      reason: reportFailureReason(error),
      stage: reportStage,
    });
    return privateResponse(
      Response.json({ status: 'unavailable' }, { status: 503 }),
      request
    );
  }
}
