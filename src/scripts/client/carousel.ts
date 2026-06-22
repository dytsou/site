function cardsPerSlide(width: number): number {
  if (width >= 1440) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function initCarousel(): void {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-carousel-slides]');
    const slides = Array.from(
      root.querySelectorAll<HTMLElement>('[data-carousel-slide]')
    );
    if (!track || slides.length === 0) return;

    let current = 0;
    let perSlide = cardsPerSlide(window.innerWidth);

    const indicators = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-carousel-indicator]')
    );
    const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]');
    const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]');

    const updateIndicators = () => {
      indicators.forEach((btn, i) => {
        const active = i === current;
        btn.classList.toggle('carousel-indicator-active', active);
        btn.classList.toggle('carousel-indicator-inactive', !active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
      });
    };

    const goTo = (index: number) => {
      current = Math.max(0, Math.min(index, slides.length - 1));
      track.style.transform = `translateX(-${current * 100}%)`;
      updateIndicators();
    };

    prev?.addEventListener('click', () =>
      goTo((current - 1 + slides.length) % slides.length)
    );
    next?.addEventListener('click', () => goTo((current + 1) % slides.length));
    indicators.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.carouselIndicator);
        if (!Number.isNaN(idx)) goTo(idx);
      });
    });

    const onResize = () => {
      const nextPer = cardsPerSlide(window.innerWidth);
      if (nextPer !== perSlide) {
        perSlide = nextPer;
        // ponytail: full regroup needs SSR re-layout; clamp slide index only
        goTo(Math.min(current, slides.length - 1));
      }
    };

    window.addEventListener('resize', onResize);
    goTo(0);
  });
}
