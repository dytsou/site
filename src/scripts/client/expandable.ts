const MOBILE_QUERY = '(max-width: 767px)';

const collapsedClasses = new WeakMap<HTMLElement, string>();

function collapsedClass(root: HTMLElement): string | undefined {
  const stored = collapsedClasses.get(root);
  if (stored) return stored;
  const collapsed = [...root.classList].find((c) => c.endsWith('-collapsed'));
  if (collapsed) collapsedClasses.set(root, collapsed);
  return collapsed;
}

function setExpanded(root: HTMLElement, expanded: boolean): void {
  const collapsed = collapsedClass(root);
  if (!collapsed) return;

  root.classList.toggle(collapsed, !expanded);
  if (root.hasAttribute('data-heatmap-state'))
    root.dataset.heatmapState = expanded ? 'expanded' : 'collapsed';

  const down = root.querySelector<SVGElement>('[data-expandable-icon="down"]');
  const up = root.querySelector<SVGElement>('[data-expandable-icon="up"]');
  down?.classList.toggle('hidden', expanded);
  up?.classList.toggle('hidden', !expanded);

  const toggle = root.querySelector<HTMLButtonElement>(
    '[data-expandable-toggle]'
  );
  toggle?.setAttribute('aria-expanded', String(expanded));
  const expandLabel = toggle?.dataset.expandLabel ?? 'Expand section';
  const collapseLabel = toggle?.dataset.collapseLabel ?? 'Collapse section';
  toggle?.setAttribute('aria-label', expanded ? collapseLabel : expandLabel);
}

function bindExpandableMobile(): void {
  const mq = globalThis.matchMedia(MOBILE_QUERY);

  document
    .querySelectorAll<HTMLElement>('[data-expandable-mobile]')
    .forEach((root) => {
      const toggle = root.querySelector<HTMLButtonElement>(
        '[data-expandable-toggle]'
      );
      if (!toggle) return;

      const onToggle = (event: Event) => {
        event.preventDefault();
        if (!mq.matches) return;
        const collapsed = collapsedClass(root);
        const isCollapsed = collapsed
          ? root.classList.contains(collapsed)
          : false;
        setExpanded(root, isCollapsed);
      };

      const syncViewport = () => setExpanded(root, !mq.matches);

      toggle.addEventListener('click', onToggle);
      mq.addEventListener('change', syncViewport);
      syncViewport();
    });
}

function initExpandableMobile(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindExpandableMobile, {
      once: true,
    });
    return;
  }
  bindExpandableMobile();
}

initExpandableMobile();
