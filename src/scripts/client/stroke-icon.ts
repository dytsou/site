/** One-shot enter draws + Lucide pathLength prep for content stroke icons. */

import { prepStrokeIcons } from './stroke-icon-prep';

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function playEnterOn(svg: Element): void {
  if (prefersReducedMotion()) return;

  svg.classList.remove('stroke-icon--play');
  // Restart CSS animation after a frame so the remove can take effect.
  requestAnimationFrame(() => {
    svg.classList.add('stroke-icon--play');

    const onEnd = () => {
      svg.classList.remove('stroke-icon--play');
      svg.removeEventListener('animationend', onEnd);
    };
    svg.addEventListener('animationend', onEnd);
  });
}

function playEnterIn(scope: ParentNode): void {
  scope.querySelectorAll('.stroke-icon').forEach((svg) => {
    if (svg.closest('[data-revealed="true"]')) playEnterOn(svg);
  });
}

function onSubtreeChange(): void {
  prepStrokeIcons(document);
  playEnterIn(document);
}

function initStrokeIcons(): void {
  prepStrokeIcons();

  if (!prefersReducedMotion()) {
    document
      .querySelectorAll('[data-revealed="true"]')
      .forEach((el) => playEnterIn(el));
  }

  const root = document.querySelector('.min-h-screen') ?? document.body;
  let scheduled = false;

  // ponytail: attribute + childList on main shell (ceiling: whole-tree MO; upgrade: #projects-only)
  const mo = new MutationObserver((mutations) => {
    let needsPrep = false;
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'data-revealed' &&
        mutation.target instanceof HTMLElement &&
        mutation.target.dataset.revealed === 'true'
      ) {
        prepStrokeIcons(mutation.target);
        if (!prefersReducedMotion()) playEnterIn(mutation.target);
      }
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        needsPrep = true;
      }
    }
    if (!needsPrep) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      onSubtreeChange();
    });
  });

  mo.observe(root, {
    attributes: true,
    attributeFilter: ['data-revealed'],
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStrokeIcons, {
    once: true,
  });
} else {
  initStrokeIcons();
}
