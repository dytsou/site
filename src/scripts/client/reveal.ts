/** Open Design Landing scroll-reveal — IntersectionObserver + auto-tagged blocks. */

const AUTO_REVEAL_SELECTORS = [
  '.section-header > .section-title',
  '.section-header > .section-divider',
  '.section-header > .section-subtitle',
  '#about .profile-image-container',
  '#about .stats-card',
  '#about .language-grid-container',
  '#experience .education-card',
  '#experience .experience-timeline-items > div',
  '#contact .contact-title',
  '#contact .contact-card',
  '#contact .opportunity-container',
  '#projects .carousel-container',
  '#projects .github-activity-title',
  '#projects .github-repos-grid > *',
  '#projects .github-button-container',
] as const;

let observer: IntersectionObserver | null = null;

const prefersReducedMotion = () =>
  globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el: HTMLElement, target: number, duration = 700): void {
  if (prefersReducedMotion()) return;

  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = String(target);
  };
  requestAnimationFrame(tick);
}

function reveal(el: HTMLElement): void {
  el.dataset.revealed = 'true';

  if (el.matches('.stats-card')) {
    const valueEl = el.querySelector<HTMLElement>('.stats-card-value');
    const target = Number.parseInt(valueEl?.textContent?.trim() ?? '', 10);
    if (valueEl && !Number.isNaN(target)) {
      animateCount(valueEl, target);
    }
  }
}

function ensureObserver(): IntersectionObserver {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target as HTMLElement);
        observer?.unobserve(entry.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
  );

  return observer;
}

function tagAutoReveal(root: ParentNode = document): void {
  for (const selector of AUTO_REVEAL_SELECTORS) {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (el.dataset.reveal !== undefined) return;
      el.dataset.reveal = '';
    });
  }
}

function observePending(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!targets.length) return;

  if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(reveal);
    return;
  }

  const io = ensureObserver();

  targets.forEach((el) => {
    if (el.dataset.reveal === 'immediate') {
      reveal(el);
      return;
    }
    if (el.dataset.revealed === 'true') return;
    if (el.dataset.revealObserved === 'true') return;
    el.dataset.revealObserved = 'true';
    io.observe(el);
  });
}

function initTimelineLine(): void {
  const timeline = document.querySelector<HTMLElement>('.experience-timeline');
  const line = document.querySelector(
    '.experience-timeline-line'
  ) as HTMLElement | null;
  if (!timeline || !line) return;

  const updateLineProgress = () => {
    const timelineRect = timeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const timelineHeight = timeline.offsetHeight;

    const scrolled = viewportHeight - timelineRect.top;
    const progress = Math.max(0, Math.min(1, scrolled / timelineHeight));

    line.style.height = `${progress * timelineHeight}px`;
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateLineProgress();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateLineProgress();
}

function initCardReveal(): void {
  const timeline = document.querySelector('.experience-timeline');
  const line = document.querySelector(
    '.experience-timeline-line'
  ) as HTMLElement | null;
  const cards = document.querySelectorAll<HTMLElement>(
    '#experience .experience-timeline-items > div'
  );

  let lastLineHeight = -1;
  const cardVisibilityMap = new Map<HTMLElement, boolean>();

  const updateDotStates = () => {
    if (!timeline || !line) return;

    const lineHeight = parseFloat(line.style.height) || 0;

    if (lineHeight === lastLineHeight) return;
    lastLineHeight = lineHeight;

    cards.forEach((card) => {
      const dot = card.querySelector('.experience-card-dot');
      if (!dot) return;

      const cardRect = card.getBoundingClientRect();
      const timelineRect = timeline.getBoundingClientRect();
      const dotRelativeTop = cardRect.top - timelineRect.top + 32;

      dot.classList.remove('is-lit', 'is-past');

      if (lineHeight >= dotRelativeTop) {
        dot.classList.add('is-past');
      }

      if (lineHeight >= dotRelativeTop && lineHeight < dotRelativeTop + 80) {
        dot.classList.remove('is-past');
        dot.classList.add('is-lit');
      }
    });
  };

  const updateCardVisibility = () => {
    const viewportHeight = window.innerHeight;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.top < viewportHeight && rect.bottom > 0;
      const wasVisible = cardVisibilityMap.get(card) ?? false;

      if (wasVisible !== isVisible) {
        cardVisibilityMap.set(card, isVisible);
        card.dataset.revealed = isVisible ? 'true' : 'false';

        const dot = card.querySelector('.experience-card-dot');
        if (dot) {
          dot.classList.remove('is-lit', 'is-past');
        }
      }
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateCardVisibility();
        const lineHeight = parseFloat(line?.style.height || '0') || 0;
        if (lineHeight !== lastLineHeight) {
          lastLineHeight = lineHeight;
          updateDotStates();
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateCardVisibility();
  updateDotStates();
}

function initReveal(): void {
  tagAutoReveal();
  observePending();
  initTimelineLine();
  initCardReveal();

  const root = document.querySelector('.min-h-screen') ?? document.body;
  let scheduled = false;

  // ponytail: client islands (carousel) mount after first pass — re-tag on DOM changes
  const mo = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      tagAutoReveal(document);
      observePending();
    });
  });

  mo.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal, { once: true });
} else {
  initReveal();
}
