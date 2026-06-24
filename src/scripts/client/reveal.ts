/** Open Design Landing scroll-reveal — IntersectionObserver + immediate hero stagger. */
function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!targets.length) return;

  const reveal = (el: HTMLElement) => el.setAttribute('data-revealed', 'true');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(reveal);
    return;
  }

  targets.forEach((el) => {
    if (el.getAttribute('data-reveal') === 'immediate') {
      reveal(el);
    }
  });

  const pending = [...targets].filter(
    (el) => el.getAttribute('data-revealed') !== 'true'
  );
  if (!pending.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
  );

  pending.forEach((el) => observer.observe(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal, { once: true });
} else {
  initReveal();
}
