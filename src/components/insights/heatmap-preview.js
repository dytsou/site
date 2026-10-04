import {
  GRID_SIZE,
  VIEWPORT_BANDS,
  getHeatmapPage,
  getHeatmapTarget,
  getViewportBand,
} from '../../../shared/heatmap-contract.js';

/** Select only geometrically compatible, visible target-local cells. Build is diagnostic; authored layout defines compatibility. */
export function matchHeatmapCells(cells, current, page) {
  const compatible = new Map();
  const omitted = {
    layout: 0,
    viewport: 0,
    theme: 0,
    state: 0,
    target: 0,
    hidden: 0,
  };
  let plotted = 0;
  for (const cell of cells) {
    let reason;
    const targets = current.targets.filter(
      (target) => target.target === cell.target
    );
    if (current.page !== page || current.layout !== cell.layout)
      reason = 'layout';
    else if (current.viewport !== cell.viewport) reason = 'viewport';
    else if (current.theme !== cell.theme) reason = 'theme';
    else if (!targets.length) reason = 'target';
    else {
      const visible = targets.filter((target) => target.visible);
      const matching = visible.filter((target) => target.state === cell.state);
      const target = matching.find((target) => target.cardsMatch);
      if (!visible.length) reason = 'hidden';
      else if (!matching.length) reason = 'state';
      else if (!target) reason = 'viewport';
      else {
        const left =
          target.rect.left + ((cell.x + 0.5) / GRID_SIZE) * target.rect.width;
        const top =
          target.rect.top + ((cell.y + 0.5) / GRID_SIZE) * target.rect.height;
        const clip = target.clip;
        if (
          clip &&
          (left < clip.left ||
            left > clip.right ||
            top < clip.top ||
            top > clip.bottom)
        )
          reason = 'hidden';
        else {
          const key = JSON.stringify([cell.target, left, top, clip]);
          const existing = compatible.get(key);
          if (existing) existing.count += cell.count;
          else
            compatible.set(key, {
              left,
              top,
              count: cell.count,
              target: cell.target,
              clip,
            });
          plotted += cell.count;
        }
      }
    }
    if (reason) omitted[reason] += cell.count;
  }
  return { points: [...compatible.values()], plotted, omitted };
}

/** This renderer is shared by the live iframe adapter and focused DOM tests. */
export function renderHeatmapOverlay(doc, layer, points) {
  layer.style.pointerEvents = 'none';
  const max = Math.max(1, ...points.map((point) => point.count));
  const nodes = points.map((point) => {
    const dot = doc.createElement('span');
    dot.dataset.heatmapCount = String(point.count);
    dot.dataset.heatmapPoint = point.target;
    dot.setAttribute('aria-hidden', 'true');
    const strength = Math.sqrt(point.count / max);
    const radius = 12 + strength * 13;
    Object.assign(dot.style, {
      position: 'absolute',
      left: `${point.left}px`,
      top: `${point.top}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      pointerEvents: 'none',
      opacity: String(0.45 + strength * 0.5),
      background:
        'radial-gradient(circle, #ff4619 0%, #ffad21 28%, #ffc83d88 50%, #ffb21a00 72%)',
      mixBlendMode: 'normal',
      transition: 'none',
    });
    if (point.clip) {
      const { left, top, right, bottom } = point.clip;
      dot.style.clipPath = `inset(${Math.max(0, top - (point.top - radius))}px ${Math.max(0, point.left + radius - right)}px ${Math.max(0, point.top + radius - bottom)}px ${Math.max(0, left - (point.left - radius))}px)`;
    }
    return dot;
  });
  layer.replaceChildren(...nodes);
}

/** No navigation in a real-page preview. Authored safe buttons keep their normal React/native handlers. */
export function installPreviewNavigation(doc, win) {
  if (
    !getHeatmapPage(win.location.pathname) ||
    !new URLSearchParams(win.location.search)
      .getAll('heatmap-preview')
      .includes('1')
  )
    return () => {};
  const block = (event) => {
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    const control = event.target?.closest?.(
      'a, button, form, [role="link"], [role="button"]'
    );
    if (event.type !== 'submit' && !control) return;
    if (
      control?.tagName === 'BUTTON' &&
      ['toggle', 'slide'].includes(control.dataset.heatmapPreviewAction) &&
      event.type !== 'submit'
    )
      return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const events = ['click', 'auxclick', 'contextmenu', 'keydown', 'submit'];
  for (const name of events) doc.addEventListener(name, block, true);
  return () => {
    for (const name of events) doc.removeEventListener(name, block, true);
  };
}

function readPreview(doc, win, page) {
  const viewport = getViewportBand(win.innerWidth);
  const cards = VIEWPORT_BANDS.find(
    (band) => band.id === viewport
  ).cardsPerSlide;
  const root = doc.documentElement;
  const measurements = new Map();
  const measure = (element) => {
    if (!measurements.has(element))
      measurements.set(element, {
        style: win.getComputedStyle(element),
        bounds: element.getBoundingClientRect(),
      });
    return measurements.get(element);
  };
  const targets = [...doc.querySelectorAll('[data-heatmap-target]')].map(
    (element) => {
      const target = element.dataset.heatmapTarget;
      const registered = getHeatmapTarget(page, target);
      const rect = measure(element).bounds;
      let visible =
        Boolean(registered) &&
        rect.width > 0 &&
        rect.height > 0 &&
        !element.closest('[hidden], [inert], [aria-hidden="true"]');
      const clip = {
        left: 0,
        top: 0,
        right: win.innerWidth,
        bottom: win.innerHeight,
      };
      for (
        let ancestor = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const { style, bounds } = measure(ancestor);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.visibility === 'collapse' ||
          Number(style.opacity) === 0
        )
          visible = false;
        if (
          ancestor !== element &&
          /hidden|clip|auto|scroll/.test(style.overflowX)
        ) {
          clip.left = Math.max(clip.left, bounds.left);
          clip.right = Math.min(clip.right, bounds.right);
        }
        if (
          ancestor !== element &&
          /hidden|clip|auto|scroll/.test(style.overflowY)
        ) {
          clip.top = Math.max(clip.top, bounds.top);
          clip.bottom = Math.min(clip.bottom, bounds.bottom);
        }
      }
      return {
        target,
        rect,
        clip,
        visible,
        state:
          element.closest('[data-heatmap-state]')?.dataset.heatmapState ??
          'default',
        cardsMatch:
          !(registered?.carousel || registered?.projectIndex !== undefined) ||
          Number(
            element.closest('[data-heatmap-cards]')?.dataset.heatmapCards
          ) === cards,
      };
    }
  );
  return {
    page: root.dataset.heatmapPage,
    layout: root.dataset.heatmapLayout,
    viewport,
    theme: root.classList.contains('dark') ? 'dark' : 'light',
    targets,
  };
}

/** Observe the actual iframe DOM and redraw once per frame. Overlay mutations never feed the observer. */
export function attachHeatmapPreview(frame, page, cells, onSummary) {
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (
    !getHeatmapPage(page) ||
    !doc ||
    !win ||
    win.location.origin !== globalThis.location.origin ||
    win.location.pathname !== page ||
    !new URLSearchParams(win.location.search)
      .getAll('heatmap-preview')
      .includes('1')
  )
    throw new Error('Preview unavailable');
  const layer = doc.createElement('div');
  layer.dataset.heatmapOverlay = '';
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    overflow: 'hidden',
    zIndex: '2147483646',
    pointerEvents: 'none',
  });
  doc.body.append(layer);
  let pending = 0;
  let stopped = false;
  let previousSummary = '';
  let previousPoints = '';
  const draw = () => {
    pending = 0;
    if (stopped) return;
    const result = matchHeatmapCells(cells, readPreview(doc, win, page), page);
    const projected = JSON.stringify(result.points);
    if (projected !== previousPoints) {
      previousPoints = projected;
      renderHeatmapOverlay(doc, layer, result.points);
    }
    // Transforms during a carousel transition change geometry without resizing.
    if (
      doc
        .getAnimations()
        .some(
          (animation) =>
            animation.playState === 'running' &&
            animation.effect?.target !== layer &&
            !layer.contains(animation.effect?.target) &&
            animation.effect
              ?.getKeyframes()
              .some((frame) =>
                [
                  'transform',
                  'translate',
                  'width',
                  'height',
                  'left',
                  'top',
                ].some((key) => key in frame)
              )
        )
    )
      schedule();
    const summary = { plotted: result.plotted, omitted: result.omitted };
    const key = JSON.stringify(summary);
    if (key !== previousSummary) {
      previousSummary = key;
      onSummary(summary);
    }
  };
  const schedule = () => {
    if (!stopped && !pending) pending = win.requestAnimationFrame(draw);
  };
  const mutation = new win.MutationObserver((records) => {
    if (
      records.some(
        (record) => record.target !== layer && !layer.contains(record.target)
      )
    )
      schedule();
  });
  mutation.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'class',
      'style',
      'hidden',
      'inert',
      'aria-hidden',
      'data-heatmap-state',
      'data-heatmap-cards',
      'data-heatmap-layout',
    ],
  });
  const resize = new win.ResizeObserver(schedule);
  resize.observe(doc.documentElement);
  resize.observe(doc.body);
  for (const target of doc.querySelectorAll('[data-heatmap-target]'))
    resize.observe(target);
  const events = [
    'scroll',
    'resize',
    'transitionrun',
    'transitionend',
    'animationstart',
    'animationend',
    'load',
  ];
  for (const name of events) win.addEventListener(name, schedule, true);
  void doc.fonts?.ready.then(schedule);
  const removeNavigation = installPreviewNavigation(doc, win);
  schedule();
  return () => {
    stopped = true;
    if (pending) win.cancelAnimationFrame(pending);
    mutation.disconnect();
    resize.disconnect();
    for (const name of events) win.removeEventListener(name, schedule, true);
    removeNavigation();
    layer.remove();
  };
}
