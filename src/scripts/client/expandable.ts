export function initExpandable(): void {
  document
    .querySelectorAll<HTMLElement>('[data-expandable]')
    .forEach((root) => {
      const toggle = root.querySelector<HTMLButtonElement>(
        '[data-expandable-toggle]'
      );
      const panel = root.querySelector<HTMLElement>('[data-expandable-panel]');
      if (!toggle || !panel) return;

      const setExpanded = (expanded: boolean) => {
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        panel.hidden = !expanded;
        const label = toggle.getAttribute('data-expand-label');
        const collapse = toggle.getAttribute('data-collapse-label');
        if (label && collapse) {
          toggle.setAttribute('aria-label', expanded ? collapse : label);
        }
      };

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        setExpanded(!expanded);
      });
    });
}
