export function initMobileNav(): void {
  const root = document.querySelector<HTMLElement>('[data-mobile-nav]');
  if (!root) return;

  const toggle = root.querySelector<HTMLButtonElement>(
    '[data-mobile-nav-toggle]'
  );
  const menu = root.querySelector<HTMLElement>('[data-mobile-nav-menu]');
  if (!toggle || !menu) return;

  const menuIcon = toggle.querySelector<SVGElement>(
    '[data-mobile-nav-icon="menu"]'
  );
  const closeIcon = toggle.querySelector<SVGElement>(
    '[data-mobile-nav-icon="close"]'
  );

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('nav-mobile-menu-closed', !open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    menuIcon?.classList.toggle('hidden', open);
    closeIcon?.classList.toggle('hidden', !open);
    if (open) {
      menu.querySelector<HTMLElement>('a')?.focus();
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}
