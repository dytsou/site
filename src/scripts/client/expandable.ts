const MOBILE_QUERY = '(max-width: 767px)';

function collapsedClass(root: HTMLElement): string | undefined {
  return [...root.classList].find((c) => c.endsWith('-collapsed'));
}

function setExpanded(root: HTMLElement, expanded: boolean): void {
  const collapsed = collapsedClass(root);
  if (!collapsed) return;

  root.classList.toggle(collapsed, !expanded);

  const down = root.querySelector<SVGElement>('[data-expandable-icon="down"]');
  const up = root.querySelector<SVGElement>('[data-expandable-icon="up"]');
  down?.classList.toggle('hidden', expanded);
  up?.classList.toggle('hidden', !expanded);

  const toggle = root.querySelector<HTMLButtonElement>(
    '[data-expandable-toggle]'
  );
  toggle?.setAttribute('aria-expanded', String(expanded));
  toggle?.setAttribute(
    'aria-label',
    expanded ? 'Collapse section' : 'Expand section'
  );
}

function initExpandableMobile(): void {
  const mq = globalThis.matchMedia(MOBILE_QUERY);

  document
    .querySelectorAll<HTMLElement>('[data-expandable-mobile]')
    .forEach((root) => {
      const toggle = root.querySelector<HTMLButtonElement>(
        '[data-expandable-toggle]'
      );
      if (!toggle) return;

      const onToggle = () => {
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

initExpandableMobile();
