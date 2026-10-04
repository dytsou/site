/**
 * Portable public telemetry contract. Authored IDs and labels are the only
 * target metadata sent to the report; DOM text and destination URLs are never
 * telemetry dimensions. Bump a page's layout revision whenever geometry or
 * its registered targets change. Build identity is supplied by the caller.
 *
 * @typedef {'narrow'|'medium'|'wide'|'extra-wide'} ViewportBand
 * @typedef {'light'|'dark'} HeatmapTheme
 * @typedef {{path: string, label: string, layout: string}} HeatmapPage
 * @typedef {{id: string, label: string, pages: readonly string[], states: readonly string[], projectIndex?: number, carousel?: boolean, slideIndex?: number}} HeatmapTarget
 * @typedef {{version: 1, page: string, target: string, layout: string, build: string, viewport: ViewportBand, theme: HeatmapTheme, state: string, time: number}} HeatmapEventBase
 * @typedef {HeatmapEventBase & {kind: 'pointer', x: number, y: number, pageX: number, pageY: number}} HeatmapPointerEvent
 * @typedef {HeatmapEventBase & {kind: 'keyboard'}} HeatmapKeyboardEvent
 * @typedef {HeatmapPointerEvent|HeatmapKeyboardEvent} HeatmapEvent
 * @typedef {'7d'|'30d'|'90d'} ReportRange
 * @typedef {{mode: 'overview', range: ReportRange, viewport: ViewportBand|'all'}|{mode: 'page', page: string, range: ReportRange, viewport: ViewportBand|'all'}} ReportFilters
 */

export const HEATMAP_VERSION = 1;
export const GRID_SIZE = 16;
export const MAX_EVENT_BYTES = 2048;
export const MAX_PAGE_COORDINATE = 100_000;
export const MAX_EVENT_AGE_MS = 86_400_000;
export const MAX_EVENT_FUTURE_MS = 300_000;
export const HEATMAP_PRIVATE_PATH = '/insights/';

/** @type {readonly Readonly<HeatmapPage>[]} */
export const HEATMAP_PAGES = Object.freeze([
  Object.freeze({ path: '/', label: 'Home', layout: 'home-v1' }),
  Object.freeze({ path: '/about/', label: 'About', layout: 'about-v1' }),
  Object.freeze({
    path: '/experiences/',
    label: 'Experiences',
    layout: 'experiences-v1',
  }),
  Object.freeze({
    path: '/projects/',
    label: 'Projects',
    layout: 'projects-v1',
  }),
  Object.freeze({ path: '/contact/', label: 'Contact', layout: 'contact-v1' }),
]);

// These thresholds also define the featured carousel's 1/2/3/4-card grouping.
export const VIEWPORT_BANDS = Object.freeze([
  Object.freeze({
    id: /** @type {ViewportBand} */ ('narrow'),
    minWidth: 0,
    cardsPerSlide: 1,
  }),
  Object.freeze({
    id: /** @type {ViewportBand} */ ('medium'),
    minWidth: 640,
    cardsPerSlide: 2,
  }),
  Object.freeze({
    id: /** @type {ViewportBand} */ ('wide'),
    minWidth: 1024,
    cardsPerSlide: 3,
  }),
  Object.freeze({
    id: /** @type {ViewportBand} */ ('extra-wide'),
    minWidth: 1440,
    cardsPerSlide: 4,
  }),
]);

export const REPORT_RANGES = Object.freeze(['7d', '30d', '90d']);
export const REPORT_MODES = Object.freeze(['overview', 'page']);
export const HEATMAP_THEMES = Object.freeze(['light', 'dark']);

// Explicit mapping to existing project source IDs, independent of title/URL.
export const HEATMAP_PROJECTS = Object.freeze([
  Object.freeze({
    key: 'koreji',
    sourceId: 'kore-ji/koreji-frontend',
    label: 'Koreji',
  }),
  Object.freeze({
    key: 'sdc-core',
    sourceId: 'NYCU-SDC/core-system-backend',
    label: 'SDC Core System',
  }),
  Object.freeze({
    key: 'proximeeting',
    sourceId: 'dytsou/ProxiMeeting',
    label: 'ProxiMeeting',
  }),
  Object.freeze({ key: 'vaehor', sourceId: 'dytsou/vaehor', label: 'Vaehor' }),
  Object.freeze({
    key: 'wordcloud',
    sourceId: 'dytsou/wordcloud',
    label: 'Wordcloud',
  }),
  Object.freeze({
    key: 'caiender',
    sourceId: 'MCHackathon2025/CAIender-frontend',
    label: 'CAIender',
  }),
  Object.freeze({
    key: 'readme-stats',
    sourceId: 'dytsou/github-readme-stats',
    label: 'GitHub README Stats',
  }),
  Object.freeze({
    key: 'when2meet',
    sourceId: 'dytsou/when2meet-to-gcal',
    label: 'When2meet to Google Calendar',
  }),
  Object.freeze({
    key: 'shorten-url',
    sourceId: 'dytsou/shorten-url',
    label: 'Shorten URL',
  }),
  Object.freeze({
    key: 'raycast-rsync',
    sourceId: 'dytsou/raycast-rsync-extension',
    label: 'Raycast Rsync Extension',
  }),
  Object.freeze({
    key: 'claude-notify',
    sourceId: 'dytsou/claude-code-notify',
    label: 'Claude Code Notify',
  }),
  Object.freeze({
    key: 'dungeon',
    sourceId: 'dytsou/Dungeon',
    label: 'Dungeon',
  }),
  Object.freeze({
    key: 'resume-builder',
    sourceId: 'dytsou/resume',
    label: 'Resume Builder',
  }),
  Object.freeze({
    key: 'intern-scheduler',
    sourceId: 'dytsou/intern-corner-scheduler',
    label: 'Intern Corner Scheduler',
  }),
]);

const publicPaths = Object.freeze(HEATMAP_PAGES.map(({ path }) => path));
const defaultStates = Object.freeze(['default']);
const expansionStates = Object.freeze(['collapsed', 'expanded']);
const navigationStates = Object.freeze(['default', 'desktop', 'mobile-open']);
const carouselStates = Object.freeze(
  HEATMAP_PROJECTS.map((_, index) => `slide-${index}`)
);
const projectStates = Object.freeze(
  carouselStates.flatMap((slide) =>
    ['closed', 'open'].flatMap((description) =>
      ['closed', 'open'].map(
        (tags) => `${slide}.description-${description}.tags-${tags}`
      )
    )
  )
);

/** @param {HeatmapTarget} target @returns {Readonly<HeatmapTarget>} */
function freezeTarget(target) {
  return Object.freeze({
    ...target,
    pages: Object.freeze([...target.pages]),
    states: Object.freeze([...target.states]),
  });
}

/** @type {readonly Readonly<HeatmapTarget>[]} */
export const HEATMAP_TARGETS = Object.freeze([
  ...[
    ['home', 'Home'],
    ['about', 'About'],
    ['experiences', 'Experiences'],
    ['projects', 'Projects'],
    ['contact', 'Contact'],
    ['resume', 'Resume'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `nav.${key}`,
      label: `Navigation: ${label}`,
      pages: publicPaths,
      states: navigationStates,
    })
  ),
  freezeTarget({
    id: 'nav.menu',
    label: 'Toggle mobile menu',
    pages: publicPaths,
    states: ['closed', 'open'],
  }),
  freezeTarget({
    id: 'nav.theme',
    label: 'Toggle theme',
    pages: publicPaths,
    states: defaultStates,
  }),
  ...[
    ['home', 'Home'],
    ['about', 'About'],
    ['experiences', 'Experiences'],
    ['projects', 'Projects'],
    ['contact', 'Contact'],
    ['resume', 'Resume'],
    ['calendar', 'Calendar'],
    ['github', 'GitHub'],
    ['linkedin', 'LinkedIn'],
    ['email', 'Email'],
    ['telegram', 'Telegram'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `footer.${key}`,
      label: `Footer: ${label}`,
      pages: publicPaths,
      states: ['default', ...expansionStates],
    })
  ),
  ...[
    ['projects', 'View my work'],
    ['contact', 'Get in touch'],
    ['resume', 'Resume'],
    ['github', 'GitHub'],
    ['linkedin', 'LinkedIn'],
    ['email', 'Email'],
    ['telegram', 'Telegram'],
    ['calendar', 'Calendar'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `home.${key}`,
      label,
      pages: ['/'],
      states: defaultStates,
    })
  ),
  ...[
    ['quick-links', 'Quick links'],
    ['connect', 'Connect'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `footer.${key}`,
      label: `Footer: toggle ${label}`,
      pages: publicPaths,
      states: expansionStates,
    })
  ),
  freezeTarget({
    id: 'about.languages',
    label: 'Expand languages',
    pages: ['/about/'],
    states: expansionStates,
  }),
  freezeTarget({
    id: 'education.details',
    label: 'Expand education details',
    pages: ['/experiences/'],
    states: expansionStates,
  }),
  ...[
    ['line', 'LINE Taiwan'],
    ['software-quality', 'Software Quality Lab'],
    ['applied-computing', 'Applied Computing and Multimedia Lab'],
    ['sdc', 'NYCU Software Development Club'],
    ['sitcon', 'SITCON'],
  ].flatMap(([key, label]) => [
    freezeTarget({
      id: `experience.${key}.organization`,
      label: `${label}: organization`,
      pages: ['/experiences/'],
      states: expansionStates,
    }),
    freezeTarget({
      id: `experience.${key}.details`,
      label: `${label}: details`,
      pages: ['/experiences/'],
      states: expansionStates,
    }),
  ]),
  ...[
    ['line.graduation', 'LINE graduation post'],
    ['line.speaker', 'LINE speaker post'],
    ['sdc.post', 'SDC post'],
    ['sitcon.post', 'SITCON post'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `experience.${key}`,
      label,
      pages: ['/experiences/'],
      states: expansionStates,
    })
  ),
  ...HEATMAP_PROJECTS.flatMap((project, projectIndex) =>
    [
      ['github', 'GitHub repository'],
      ['description', 'Toggle description'],
      ['tags', 'Toggle tags'],
    ].map(([action, label]) =>
      freezeTarget({
        id: `project.${project.key}.${action}`,
        label: `${project.label}: ${label}`,
        pages: ['/projects/'],
        states: projectStates,
        projectIndex,
      })
    )
  ),
  ...['previous', 'next'].map((action) =>
    freezeTarget({
      id: `carousel.${action}`,
      label: `Carousel: ${action}`,
      pages: ['/projects/'],
      states: carouselStates,
      carousel: true,
    })
  ),
  ...HEATMAP_PROJECTS.map((_, slideIndex) =>
    freezeTarget({
      id: `carousel.slide-${slideIndex}`,
      label: `Carousel: slide ${slideIndex + 1}`,
      pages: ['/projects/'],
      states: carouselStates,
      carousel: true,
      slideIndex,
    })
  ),
  freezeTarget({
    id: 'projects.github',
    label: 'View GitHub profile',
    pages: ['/projects/'],
    states: defaultStates,
  }),
  ...[
    ['linkedin', 'LinkedIn'],
    ['github', 'GitHub'],
    ['email', 'Email'],
  ].map(([key, label]) =>
    freezeTarget({
      id: `contact.${key}`,
      label: `Contact: ${label}`,
      pages: ['/contact/'],
      states: defaultStates,
    })
  ),
]);

const pageByPath = new Map(HEATMAP_PAGES.map((page) => [page.path, page]));
const targetById = new Map(
  HEATMAP_TARGETS.map((target) => [target.id, target])
);

/** @param {string} path @returns {Readonly<HeatmapPage>|null} */
export function getHeatmapPage(path) {
  return pageByPath.get(path) ?? null;
}

/** @param {string} page @param {string} id @returns {Readonly<HeatmapTarget>|null} */
export function getHeatmapTarget(page, id) {
  const target = targetById.get(id);
  return target?.pages.includes(page) ? target : null;
}

/** @param {number} width @returns {ViewportBand} */
export function getViewportBand(width) {
  if (!Number.isFinite(width) || width <= 0)
    throw new TypeError('Invalid viewport width');
  const band = VIEWPORT_BANDS.findLast((band) => width >= band.minWidth);
  if (!band) throw new TypeError('Invalid viewport width');
  return band.id;
}

/** @param {number} x normalized target position @param {number} y normalized target position */
export function quantizeTargetPoint(x, y) {
  if (
    ![x, y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)
  ) {
    throw new TypeError('Invalid target point');
  }
  return {
    x: Math.min(GRID_SIZE - 1, Math.floor(x * GRID_SIZE)),
    y: Math.min(GRID_SIZE - 1, Math.floor(y * GRID_SIZE)),
  };
}

/** @param {unknown} input @returns {Record<string, unknown>} */
function record(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TypeError('Invalid contract object');
  return /** @type {Record<string, unknown>} */ (input);
}

/** @param {Record<string, unknown>} input @param {readonly string[]} fields */
function exactFields(input, fields) {
  if (
    Object.keys(input).length !== fields.length ||
    !fields.every((field) => Object.hasOwn(input, field))
  ) {
    throw new TypeError('Invalid contract fields');
  }
}

/** @param {unknown} value @param {number} max */
function boundedInteger(value, max) {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

/** @param {HeatmapTarget} target @param {string} state @param {ViewportBand} viewport */
function validateTargetState(target, state, viewport) {
  if (!target.states.includes(state))
    throw new TypeError('Invalid target state');
  if (target.projectIndex === undefined && !target.carousel) return;
  const band = VIEWPORT_BANDS.find((band) => band.id === viewport);
  if (!band) throw new TypeError('Invalid viewport band');
  const cards = band.cardsPerSlide;
  const slide = Number(state.split('.')[0].slice('slide-'.length));
  const slides = Math.ceil(HEATMAP_PROJECTS.length / cards);
  if (
    slide >= slides ||
    (target.slideIndex !== undefined && target.slideIndex >= slides) ||
    (target.projectIndex !== undefined &&
      slide !== Math.floor(target.projectIndex / cards))
  ) {
    throw new TypeError('Target state does not match viewport grouping');
  }
}

/**
 * Accept one exact, anonymous event. Validation returns a new object with a
 * stable field order. Keyboard events must omit every spatial field.
 * @param {unknown} input
 * @param {{now?: number}} options
 * @returns {HeatmapEvent}
 */
export function validateHeatmapEvent(input, { now = Date.now() } = {}) {
  const event = record(input);
  const baseFields = [
    'version',
    'page',
    'target',
    'layout',
    'build',
    'viewport',
    'theme',
    'state',
    'kind',
    'time',
  ];
  const fields =
    event.kind === 'pointer'
      ? [...baseFields, 'x', 'y', 'pageX', 'pageY']
      : baseFields;
  exactFields(event, fields);
  const page = getHeatmapPage(/** @type {string} */ (event.page));
  const target = getHeatmapTarget(
    /** @type {string} */ (event.page),
    /** @type {string} */ (event.target)
  );
  if (
    event.version !== HEATMAP_VERSION ||
    !page ||
    !target ||
    event.layout !== page.layout ||
    typeof event.build !== 'string' ||
    !/^(?:local|[a-f0-9]{7,40})$/.test(event.build) ||
    !VIEWPORT_BANDS.some((band) => band.id === event.viewport) ||
    !HEATMAP_THEMES.includes(/** @type {string} */ (event.theme)) ||
    typeof event.state !== 'string' ||
    (event.kind !== 'pointer' && event.kind !== 'keyboard') ||
    !boundedInteger(now, 8_640_000_000_000_000) ||
    !boundedInteger(event.time, 8_640_000_000_000_000) ||
    /** @type {number} */ (event.time) < now - MAX_EVENT_AGE_MS ||
    /** @type {number} */ (event.time) > now + MAX_EVENT_FUTURE_MS
  ) {
    throw new TypeError('Invalid heatmap event');
  }
  validateTargetState(
    target,
    event.state,
    /** @type {ViewportBand} */ (event.viewport)
  );
  if (
    event.kind === 'pointer' &&
    (!boundedInteger(event.x, GRID_SIZE - 1) ||
      !boundedInteger(event.y, GRID_SIZE - 1) ||
      !boundedInteger(event.pageX, MAX_PAGE_COORDINATE) ||
      !boundedInteger(event.pageY, MAX_PAGE_COORDINATE))
  ) {
    throw new TypeError('Invalid pointer coordinates');
  }
  return /** @type {HeatmapEvent} */ (
    Object.fromEntries(fields.map((field) => [field, event[field]]))
  );
}

/** @param {unknown} input @returns {ReportFilters} */
export function validateReportFilters(input) {
  const filters = record(input);
  const fields =
    filters.mode === 'page'
      ? ['mode', 'range', 'viewport', 'page']
      : ['mode', 'range', 'viewport'];
  exactFields(filters, fields);
  if (
    !REPORT_MODES.includes(/** @type {string} */ (filters.mode)) ||
    !REPORT_RANGES.includes(/** @type {string} */ (filters.range)) ||
    (filters.viewport !== 'all' &&
      !VIEWPORT_BANDS.some((band) => band.id === filters.viewport)) ||
    (filters.mode === 'page' &&
      !getHeatmapPage(/** @type {string} */ (filters.page)))
  ) {
    throw new TypeError('Invalid report filters');
  }
  return /** @type {ReportFilters} */ (
    Object.fromEntries(fields.map((field) => [field, filters[field]]))
  );
}

/**
 * N UTC calendar dates, including today's partial date, ending at now.
 * @param {ReportRange} range @param {number} now
 */
export function getReportWindow(range, now = Date.now()) {
  if (
    !REPORT_RANGES.includes(range) ||
    !boundedInteger(now, 8_640_000_000_000_000)
  )
    throw new TypeError('Invalid report window');
  const days = Number.parseInt(range, 10);
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days + 1);
  return { start: date.toISOString(), end: new Date(now).toISOString(), days };
}
