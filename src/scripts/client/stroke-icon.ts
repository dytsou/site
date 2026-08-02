/** Normalize Lucide/SVG stroke lengths so CSS dasharray:1 draws evenly. */

const SHAPE = 'path, circle, rect, line, polyline, polygon';

export function prepStrokeIcons(root: ParentNode = document): void {
  root.querySelectorAll('.stroke-icon').forEach((svg) => {
    svg.querySelectorAll(SHAPE).forEach((el) => {
      if (!el.hasAttribute('pathLength')) {
        el.setAttribute('pathLength', '1');
      }
    });
  });
}

function initStrokeIcons(): void {
  prepStrokeIcons();

  const root = document.querySelector('.min-h-screen') ?? document.body;
  let scheduled = false;

  // ponytail: React carousel remounts wipe pathLength — re-prep on DOM churn (ceiling: whole-tree MO; upgrade: scoped observe on #projects)
  const mo = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      prepStrokeIcons(document);
    });
  });

  mo.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStrokeIcons, {
    once: true,
  });
} else {
  initStrokeIcons();
}
