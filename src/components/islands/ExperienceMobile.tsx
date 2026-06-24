import { useEffect } from 'react';

export function ExperienceMobile() {
  useEffect(() => {
    const mq = globalThis.matchMedia('(max-width: 767px)');

    const bindToggle = (button: HTMLButtonElement) => {
      const panel = button
        .closest('.education-info, .experience-card-info')
        ?.querySelector<HTMLElement>('[data-expandable-mobile-content]');
      if (!panel) return;

      const update = (expanded: boolean) => {
        panel.classList.toggle('collapsed', !expanded);
        button.textContent = expanded ? 'Show less' : 'Show more';
        button.setAttribute(
          'aria-label',
          expanded ? 'Collapse details' : 'Expand details'
        );
      };

      const onClick = () => {
        if (!mq.matches) return;
        const expanded = panel.classList.contains('collapsed');
        update(expanded);
      };

      const syncViewport = () => {
        if (!mq.matches) {
          panel.classList.remove('collapsed');
          button.hidden = true;
          return;
        }
        button.hidden = false;
        button.textContent = panel.classList.contains('collapsed')
          ? 'Show more'
          : 'Show less';
      };

      button.addEventListener('click', onClick);
      mq.addEventListener('change', syncViewport);
      syncViewport();

      return () => {
        button.removeEventListener('click', onClick);
        mq.removeEventListener('change', syncViewport);
      };
    };

    const cleanups = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '[data-expandable-mobile-only]'
      )
    ).map(bindToggle);

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, []);

  return null;
}
