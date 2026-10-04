import { useEffect, useRef, useState } from 'react';
import { HEATMAP_PAGES } from '../../../shared/heatmap-contract.js';
import {
  createReportLoader,
  fillReportDays,
  sameReportFilters,
} from './report-loader.js';
import { attachHeatmapPreview } from './heatmap-preview.js';
import './ClickInsights.css';

type Band = 'narrow' | 'medium' | 'wide' | 'extra-wide';
type Filters = {
  mode: 'overview' | 'page';
  page?: string;
  range: '7d' | '30d' | '90d';
  viewport: Band | 'all';
};
type Cell = {
  target: string;
  layout: string;
  build: string;
  viewport: Band;
  theme: string;
  state: string;
  x: number;
  y: number;
  count: number;
};
type WindowRange = { start: string; end: string; days: number };
type Report = {
  status: 'ready' | 'empty';
  filters: Filters;
  window: WindowRange;
  total: number;
  sampled: boolean;
  pages: { page: string; label: string; count: number; share: number }[];
  targets: { target: string; label: string; count: number; share: number }[];
  days: { date: string; count: number }[];
  cells: Cell[];
  pageViews: {
    status: 'ready' | 'empty' | 'unavailable';
    source: string;
    total?: number;
    host?: string;
    window?: WindowRange;
  };
};
type LoadState = {
  status: 'loading' | 'ready' | 'empty' | 'unavailable' | 'denied' | 'invalid';
  filters: Filters;
  report?: Report;
};
type Summary = {
  plotted: number;
  omitted: {
    layout: number;
    viewport: number;
    theme: number;
    state: number;
    target: number;
    hidden: number;
  };
};
const PREVIEWS: { band: Band; label: string; width: number }[] = [
  { band: 'narrow', label: 'Mobile · 390 px', width: 390 },
  { band: 'medium', label: 'Tablet · 800 px', width: 800 },
  { band: 'wide', label: 'Desktop · 1280 px', width: 1280 },
  { band: 'extra-wide', label: 'Large desktop · 1600 px', width: 1600 },
];
const number = (value: number) => new Intl.NumberFormat('en-US').format(value);
const share = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
const date = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

function DailyActivity({ report }: Readonly<{ report: Report }>) {
  const days = fillReportDays(report.window, report.days);
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <section className="insights-panel insights-activity">
      <div className="insights-section-heading">
        <h2>Clicks over time</h2>
        <span>UTC dates</span>
      </div>
      <div className="insights-bars" aria-hidden="true">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${number(day.count)} clicks`}
            style={{
              height: `${day.count ? Math.max(3, (day.count / max) * 100) : 0}%`,
            }}
          />
        ))}
      </div>
      <div className="insights-chart-labels">
        <span>{date(report.window.start)}</span>
        <span>{date(report.window.end)}</span>
      </div>
      <details className="insights-daily-details">
        <summary>View daily counts</summary>
        <div className="insights-table-scroll">
          <table>
            <caption className="insights-sr-only">
              Daily recorded clicks in UTC
            </caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{day.date}</th>
                  <td>{number(day.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function Preview({
  report,
  band,
  theme,
  onBand,
  onTheme,
}: Readonly<{
  report: Report;
  band: Band;
  theme: 'light' | 'dark';
  onBand: (band: Band) => void;
  onTheme: (theme: 'light' | 'dark') => void;
}>) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const page = report.filters.page!;
  const definition = HEATMAP_PAGES.find((item) => item.path === page)!;
  const preview = PREVIEWS.find((item) => item.band === band)!;
  const previewKey = `${page}:${band}:${retry}`;
  const shownSummary = loaded === previewKey ? summary : null;
  const [observed, setObserved] = useState<{
    theme: string;
    band: Band;
  } | null>(null);
  useEffect(() => {
    const frame = iframe.current;
    if (!frame || loaded !== previewKey) return;
    try {
      const html = frame.contentDocument?.documentElement;
      if (!html) return;
      html.classList.remove('light', 'dark');
      html.classList.add(theme);
      const observer = new MutationObserver(() =>
        setObserved({
          theme: html.classList.contains('dark') ? 'dark' : 'light',
          band,
        })
      );
      observer.observe(html, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    } catch {
      /* A failed preview is reported by the adapter below. */
    }
  }, [theme, loaded, band, previewKey]);
  useEffect(() => {
    const frame = iframe.current;
    if (!frame || loaded !== previewKey) return;
    let canceled = false;
    try {
      const cleanup = attachHeatmapPreview(
        frame,
        page,
        report.cells,
        (next: Summary) => setSummary(next)
      );
      return () => {
        canceled = true;
        cleanup();
      };
    } catch {
      queueMicrotask(() => {
        if (!canceled) setFailed(true);
      });
      return () => {
        canceled = true;
      };
    }
  }, [page, report.cells, loaded, previewKey]);
  const messages: [keyof Summary['omitted'], string][] = [
    ['layout', 'come from an older layout and cannot be placed on this page'],
    ['viewport', 'belong to another screen size or carousel grouping'],
    ['theme', 'belong to another color theme'],
    ['state', 'belong to another menu, expansion, or carousel state'],
    ['target', 'belong to a target that is no longer on this page'],
    [
      'hidden',
      'belong to a hidden target or a point outside the visible preview',
    ],
  ];
  return (
    <section
      className="insights-panel insights-preview"
      aria-labelledby="preview-heading"
    >
      <div className="insights-section-heading">
        <div>
          <h2 id="preview-heading">{definition.label} heatmap</h2>
          <p>
            Explore the real page. Menus, expansions, and slides work; links
            stay here.
          </p>
        </div>
        <span className="insights-pill">Preview · no collection</span>
      </div>
      <div className="insights-preview-toolbar">
        <label>
          <span>Preview size</span>
          <select
            value={band}
            disabled={report.filters.viewport !== 'all'}
            onChange={(event) => onBand(event.target.value as Band)}
          >
            {PREVIEWS.map((item) => (
              <option key={item.band} value={item.band}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Preview theme</span>
          <select
            value={observed?.band === band ? observed.theme : theme}
            onChange={(event) => {
              const next = event.target.value as 'light' | 'dark';
              const html = iframe.current?.contentDocument?.documentElement;
              html?.classList.remove('light', 'dark');
              html?.classList.add(next);
              setObserved(null);
              onTheme(next);
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <div className="insights-legend">
          <span className="insights-legend-gradient" aria-hidden="true" />
          <span>Lower → higher intensity</span>
        </div>
      </div>
      <p id="preview-scroll-help" className="insights-preview-help">
        {preview.width} px preview. Scroll inside the page to inspect more
        targets; scroll this frame horizontally on smaller screens.
      </p>
      <section
        className="insights-preview-scroll"
        aria-label={`${definition.label} page preview at ${preview.width} pixels`}
        aria-describedby="preview-scroll-help"
        tabIndex={0} // NOSONAR: Keyboard focus enables scrolling this overflow region.
      >
        <iframe
          key={previewKey}
          ref={iframe}
          title={`${definition.label} heatmap preview`}
          src={`${page}?heatmap-preview=1`}
          width={preview.width}
          height="720"
          sandbox="allow-same-origin allow-scripts"
          onLoad={() => {
            setFailed(false);
            setSummary(null);
            setLoaded(previewKey);
          }}
        />
      </section>
      <div className="insights-overlay-status" aria-live="polite">
        {failed && loaded === previewKey ? (
          <p>
            Page preview unavailable. Target counts are still available.{' '}
            <button
              onClick={() => {
                setLoaded(null);
                setRetry((value) => value + 1);
              }}
            >
              Reload preview
            </button>
          </p>
        ) : (
          <p>
            <strong>{shownSummary ? number(shownSummary.plotted) : '…'}</strong>{' '}
            {report.sampled ? 'estimated pointer clicks' : 'pointer clicks'}{' '}
            shown in the current view. Keyboard activity contributes to target
            counts only.
          </p>
        )}
        {shownSummary && (
          <ul>
            {messages
              .filter(([key]) => shownSummary.omitted[key] > 0)
              .map(([key, message]) => (
                <li key={key}>
                  {number(shownSummary.omitted[key])} pointer clicks {message}.
                </li>
              ))}
          </ul>
        )}
        <p>
          Target counts below include keyboard activity and clicks that cannot
          be drawn here. Intensity is relative to the visible points.{' '}
          {report.sampled &&
            'Target counts and spatial points are sampled separately; their estimates may differ.'}
        </p>
      </div>
    </section>
  );
}

function reportFailureTitle(status: LoadState['status']): string {
  if (status === 'denied') return 'This report is private.';
  if (status === 'invalid') return 'These filters could not be applied.';
  return 'Click data is unavailable.';
}

function focusRequestedPage(
  mode: Filters['mode'],
  report: Report | undefined,
  pending: { current: boolean },
  heading: { current: HTMLHeadingElement | null }
): void {
  if (mode !== 'page' || !report || !pending.current) return;
  heading.current?.focus();
  pending.current = false;
}

export function ClickInsights() {
  const [filters, setFilters] = useState<Filters>({
    mode: 'overview',
    range: '7d',
    viewport: 'all',
  });
  const [state, setState] = useState<LoadState>({ status: 'loading', filters });
  const [retry, setRetry] = useState(0);
  const [previewBand, setPreviewBand] = useState<Band>('wide');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const pendingPageFocus = useRef(false);
  useEffect(() => {
    const loader = createReportLoader(
      window.fetch.bind(window),
      (next: LoadState) => setState(next)
    );
    void loader.load(filters);
    return () => loader.cancel();
  }, [filters, retry]);
  // The filter event renders before the effect; withhold old data in that render too.
  const applied = sameReportFilters(state.filters, filters)
    ? state
    : { status: 'loading' as const, filters };
  const report = applied.report;
  useEffect(() => {
    focusRequestedPage(filters.mode, report, pendingPageFocus, pageHeading);
  }, [filters.mode, report]);
  const pageLabel = HEATMAP_PAGES.find(
    (item) => item.path === filters.page
  )?.label;
  const band = filters.viewport === 'all' ? previewBand : filters.viewport;
  const change = (patch: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...patch }));
  return (
    <div className="insights" data-insights-status={applied.status}>
      <header className="insights-header">
        <p className="insights-eyebrow">
          Owner workspace <span>Private</span>
        </p>
        <h1>
          Where attention turns
          <br />
          <span>into action.</span>
        </h1>
        <p>
          Recorded clicks across your site. Choose a page to see which controls
          people use, and where they click.
        </p>
      </header>
      <div className="insights-controls">
        <div className="insights-breadcrumb">
          {filters.mode === 'page' ? (
            <>
              <button
                onClick={() => {
                  pendingPageFocus.current = false;
                  setFilters(({ range, viewport }) => ({
                    mode: 'overview',
                    range,
                    viewport,
                  }));
                }}
              >
                ← All pages
              </button>
              <span aria-hidden="true">/</span>
              <strong>{pageLabel}</strong>
            </>
          ) : (
            <strong>All pages</strong>
          )}
        </div>
        <div className="insights-filter-fields">
          <label>
            <span>Date range</span>
            <select
              value={filters.range}
              onChange={(event) =>
                change({ range: event.target.value as Filters['range'] })
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label>
            <span>Visitor screen size</span>
            <select
              value={filters.viewport}
              onChange={(event) =>
                change({ viewport: event.target.value as Filters['viewport'] })
              }
            >
              <option value="all">All screen sizes</option>
              {PREVIEWS.map((item) => (
                <option key={item.band} value={item.band}>
                  {item.label.split(' · ')[0]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div
        className="insights-results"
        aria-busy={applied.status === 'loading'}
      >
        {applied.status === 'loading' && (
          <div className="insights-state">
            <span className="insights-loading" aria-hidden="true" />
            <h2>
              <output aria-describedby="insights-loading-detail">
                Loading click data
              </output>
            </h2>
            <p id="insights-loading-detail">
              Updating the report for your selected filters.
            </p>
          </div>
        )}
        {['unavailable', 'denied', 'invalid'].includes(applied.status) && (
          <div className="insights-state" role="alert">
            <p className="insights-eyebrow">Report unavailable</p>
            <h2>{reportFailureTitle(applied.status)}</h2>
            <p>
              {applied.status === 'denied'
                ? 'Sign in with the authorized owner account, then reload this page.'
                : 'No counts are shown while the report is unavailable. Try loading the selected filters again.'}
            </p>
            <button
              className="insights-primary"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry report
            </button>
          </div>
        )}
        {report && (
          <>
            <div className="insights-report-heading">
              <h2 ref={pageHeading} tabIndex={-1}>
                {filters.mode === 'page'
                  ? `${pageLabel} clicks`
                  : 'Click overview'}
              </h2>
              <span>
                {date(report.window.start)} – {date(report.window.end)} · UTC
              </span>
            </div>
            {report.sampled && (
              <output className="insights-notice">
                Estimated totals · Cloudflare sampled this data. Counts and
                shares use sampling weights.
              </output>
            )}
            <div className="insights-metrics">
              <section className="insights-metric">
                <h3>
                  {report.sampled
                    ? 'Estimated recorded clicks'
                    : 'Recorded clicks'}
                </h3>
                <strong data-insights-total>{number(report.total)}</strong>
                <p>
                  {filters.viewport === 'all'
                    ? 'Across all visitor screen sizes'
                    : `From ${PREVIEWS.find(
                        (item) => item.band === filters.viewport
                      )
                        ?.label.split(' · ')[0]
                        .toLowerCase()} screens`}
                </p>
              </section>
              <section className="insights-metric">
                <h3>
                  {filters.mode === 'overview'
                    ? 'Pages with clicks'
                    : 'Targets with clicks'}
                </h3>
                <strong>
                  {filters.mode === 'overview'
                    ? report.pages.filter((item) => item.count > 0).length
                    : report.targets.length}
                </strong>
                <p>
                  {filters.mode === 'overview'
                    ? 'Select a page below to explore'
                    : 'Including target-only keyboard activity'}
                </p>
              </section>
              <section className="insights-metric insights-context">
                <h3>Page views</h3>
                <strong>
                  {report.pageViews.status === 'unavailable'
                    ? 'Unavailable'
                    : number(report.pageViews.total ?? 0)}
                </strong>
                <p>
                  Cloudflare Web Analytics · separate context
                  {report.pageViews.host ? ` for ${report.pageViews.host}` : ''}
                </p>
              </section>
            </div>
            <p className="insights-context-note">
              Clicks count actions, including repeated clicks. Page views
              describe a separate audience measurement; they are not a
              conversion rate.{' '}
              {report.pageViews.status === 'unavailable' &&
                'Page-view context is not available for these filters.'}
            </p>
            {report.status === 'empty' && (
              <div className="insights-state insights-empty">
                <h2>
                  <output aria-describedby="insights-empty-detail">
                    No recorded clicks in this range.
                  </output>
                </h2>
                <p id="insights-empty-detail">
                  Choose another date range or screen size to look for activity.
                </p>
              </div>
            )}
            {filters.mode === 'overview' ? (
              <section className="insights-panel">
                <div className="insights-section-heading">
                  <div>
                    <h2>Choose a page</h2>
                    <p>
                      Share of recorded clicks across the selected pages and
                      filters.
                    </p>
                  </div>
                  <span>01 / Explore</span>
                </div>
                <div className="insights-table-scroll">
                  <table className="insights-page-table">
                    <caption className="insights-sr-only">
                      Recorded clicks by page
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Page</th>
                        <th scope="col">Clicks</th>
                        <th scope="col">Share</th>
                        <th scope="col">
                          <span className="insights-sr-only">Explore</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...report.pages]
                        .sort((a, b) => b.count - a.count)
                        .map((item) => (
                          <tr key={item.page}>
                            <th scope="row">
                              <span>{item.label}</span>
                              <small>{item.page}</small>
                            </th>
                            <td>{number(item.count)}</td>
                            <td>
                              <span className="insights-share">
                                {share(item.share)}
                                <span
                                  aria-hidden="true"
                                  className="insights-share-track"
                                >
                                  <span
                                    style={{ width: `${item.share * 100}%` }}
                                  />
                                </span>
                              </span>
                            </td>
                            <td>
                              <button
                                aria-label={`Open ${item.label} heatmap`}
                                onClick={() => {
                                  pendingPageFocus.current = true;
                                  setFilters((current) => ({
                                    ...current,
                                    mode: 'page',
                                    page: item.page,
                                  }));
                                }}
                              >
                                Open heatmap <span aria-hidden="true">↗</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <>
                <Preview
                  key={`${filters.page}:${filters.range}:${filters.viewport}`}
                  report={report}
                  band={band}
                  theme={theme}
                  onBand={setPreviewBand}
                  onTheme={setTheme}
                />
                <section className="insights-panel">
                  <div className="insights-section-heading">
                    <div>
                      <h2>Most used targets</h2>
                      <p>
                        All recorded clicks, including keyboard clicks and
                        points omitted from the preview.
                      </p>
                    </div>
                    <span>02 / Compare</span>
                  </div>
                  <div className="insights-table-scroll">
                    <table>
                      <caption className="insights-sr-only">
                        Ranked target counts and share of recorded page clicks
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Target</th>
                          <th scope="col">Clicks</th>
                          <th scope="col">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.targets.map((item) => (
                          <tr key={item.target}>
                            <th scope="row">{item.label}</th>
                            <td>{number(item.count)}</td>
                            <td>{share(item.share)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!report.targets.length && (
                      <p className="insights-table-empty">
                        No targets recorded for these filters.
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}
            {report.days.length > 0 && <DailyActivity report={report} />}
          </>
        )}
      </div>
      <footer className="insights-footnote">
        <span>Anonymous, aggregate click data</span>
        <span>History limited to the last 90 days</span>
      </footer>
    </div>
  );
}
