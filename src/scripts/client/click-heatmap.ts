import {
  HEATMAP_VERSION,
  MAX_EVENT_BYTES,
  MAX_PAGE_COORDINATE,
  VIEWPORT_BANDS,
  getHeatmapPage,
  getHeatmapTarget,
  getViewportBand,
  quantizeTargetPoint,
  validateHeatmapEvent,
} from '../../../shared/heatmap-contract.js';

function collectionPage(doc: Document, win: Window) {
  if (
    new URLSearchParams(win.location.search)
      .getAll('heatmap-preview')
      .includes('1')
  )
    return null;
  const page = getHeatmapPage(win.location.pathname);
  return page?.path === doc.documentElement.dataset.heatmapPage ? page : null;
}

/** Read authored metadata at capture time, before any click handler changes it. */
export function buildHeatmapEvent(
  activation: MouseEvent,
  doc: Document,
  win: Window,
  now = Date.now()
) {
  try {
    const page = collectionPage(doc, win);
    if (!page || !activation.isTrusted || activation.button !== 0) return null;
    const origin = activation.target as Element | null;
    const target = origin?.closest?.(
      '[data-heatmap-target]'
    ) as HTMLElement | null;
    if (
      !target?.matches('a[href], button') ||
      (target as HTMLButtonElement).disabled ||
      target.getAttribute('aria-disabled') === 'true' ||
      target.closest('[inert], [hidden], [aria-hidden="true"]')
    )
      return null;
    const id = target.dataset.heatmapTarget ?? '';
    const registered = getHeatmapTarget(page.path, id);
    if (!registered) return null;
    const viewport = getViewportBand(win.innerWidth);
    if (registered.carousel || registered.projectIndex !== undefined) {
      const renderedCards = Number(
        (target.closest('[data-heatmap-cards]') as HTMLElement | null)?.dataset
          .heatmapCards
      );
      if (
        renderedCards !==
        VIEWPORT_BANDS.find((band) => band.id === viewport)?.cardsPerSlide
      )
        return null;
    }
    const state =
      (target.closest('[data-heatmap-state]') as HTMLElement | null)?.dataset
        .heatmapState ?? 'default';
    const base = {
      version: HEATMAP_VERSION,
      page: page.path,
      target: id,
      layout: doc.documentElement.dataset.heatmapLayout,
      build: doc.documentElement.dataset.heatmapBuild,
      viewport,
      theme: doc.documentElement.classList.contains('dark') ? 'dark' : 'light',
      state,
      time: now,
    };
    if (activation.detail === 0)
      return validateHeatmapEvent({ ...base, kind: 'keyboard' }, { now });
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const point = quantizeTargetPoint(
      (activation.clientX - rect.left) / rect.width,
      (activation.clientY - rect.top) / rect.height
    );
    if (
      ![activation.pageX, activation.pageY].every(
        (coordinate) =>
          Number.isFinite(coordinate) &&
          coordinate >= 0 &&
          coordinate <= MAX_PAGE_COORDINATE
      )
    )
      return null;
    return validateHeatmapEvent(
      {
        ...base,
        kind: 'pointer',
        ...point,
        pageX: Math.round(activation.pageX),
        pageY: Math.round(activation.pageY),
      },
      { now }
    );
  } catch {
    return null;
  }
}

/** One native click covers pointer and Enter/Space activation without dedup IDs. */
export function installHeatmapCollector(doc: Document, win: Window) {
  if (!collectionPage(doc, win)) return () => {};
  const onClick = (activation: MouseEvent) => {
    const event = buildHeatmapEvent(activation, doc, win);
    if (!event) return;
    try {
      const body = JSON.stringify(event);
      if (new TextEncoder().encode(body).byteLength > MAX_EVENT_BYTES) return;
      void win
        .fetch('/api/click-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          credentials: 'omit',
          keepalive: true,
        })
        .catch(() => {});
    } catch {
      // Collection must never interrupt the visitor's original action.
    }
  };
  doc.addEventListener('click', onClick, { capture: true, passive: true });
  return () => doc.removeEventListener('click', onClick, { capture: true });
}

if (typeof document !== 'undefined' && typeof window !== 'undefined')
  installHeatmapCollector(document, window);
