/** Set pathLength="1" on stroked children so CSS dasharray:1 draws evenly. */

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
