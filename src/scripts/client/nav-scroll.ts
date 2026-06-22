export function initNavScroll(): void {
  const nav = document.querySelector<HTMLElement>('[data-mobile-nav]');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('nav-scrolled', window.scrollY > 50);
    nav.classList.toggle('nav-transparent', window.scrollY <= 50);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}
