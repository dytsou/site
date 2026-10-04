import { validateReportFilters } from '../../../shared/heatmap-contract.js';

export function sameReportFilters(a, b) {
  return Boolean(
    a &&
    b &&
    a.mode === b.mode &&
    a.range === b.range &&
    a.viewport === b.viewport &&
    (a.mode !== 'page' || a.page === b.page)
  );
}

/** Clear data before every request; abort is an optimization, sequence + applied filters are the correctness boundary. */
export function createReportLoader(fetchImpl, publish) {
  let sequence = 0;
  let controller;
  return {
    async load(input) {
      const filters = validateReportFilters(input);
      const current = ++sequence;
      controller?.abort();
      controller = new AbortController();
      publish({ status: 'loading', filters });
      try {
        const response = await fetchImpl(
          `/api/insights/report?${new URLSearchParams(filters)}`,
          {
            credentials: 'same-origin',
            cache: 'no-store',
            redirect: 'error',
            signal: controller.signal,
          }
        );
        if (current !== sequence) return;
        if (!response.ok) {
          publish({
            status:
              response.status === 403
                ? 'denied'
                : response.status === 400
                  ? 'invalid'
                  : 'unavailable',
            filters,
          });
          return;
        }
        const report = await response.json();
        if (current !== sequence) return;
        if (
          !sameReportFilters(filters, report.filters) ||
          !['ready', 'empty'].includes(report.status) ||
          !Number.isFinite(report.total) ||
          report.total < 0 ||
          !['pages', 'targets', 'cells', 'days'].every((key) =>
            Array.isArray(report[key])
          ) ||
          !report.window ||
          !report.pageViews
        )
          throw new Error('Invalid report');
        publish({ status: report.status, filters, report });
      } catch {
        if (current === sequence) publish({ status: 'unavailable', filters });
      }
    },
    cancel() {
      ++sequence;
      controller?.abort();
    },
  };
}

/** Calendar days stay in chronological slots even when the aggregate has no row for a zero-click day. */
export function fillReportDays(window, rows) {
  const start = Date.parse(`${window.start.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${window.end.slice(0, 10)}T00:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start ||
    end - start > 90 * 86_400_000
  )
    throw new TypeError('Invalid report window');
  const counts = new Map(rows.map((row) => [row.date, row.count]));
  const days = [];
  for (let time = start; time <= end; time += 86_400_000) {
    const date = new Date(time).toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0 });
  }
  return days;
}
