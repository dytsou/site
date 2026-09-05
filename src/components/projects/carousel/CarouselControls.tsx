import type { KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ProjectCarousel.css';

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  currentSlide: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  carouselId: string;
}

export function CarouselControls({
  onPrev,
  onNext,
  currentSlide,
  totalSlides,
  onGoToSlide,
  onKeyDown,
  carouselId,
}: Readonly<CarouselControlsProps>) {
  if (totalSlides <= 1) return null;

  const previousSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  const nextSlide = (currentSlide + 1) % totalSlides;

  return (
    <nav
      className="carousel-navigation"
      aria-label="Project carousel navigation"
    >
      <button
        type="button"
        onClick={onPrev}
        onKeyDown={onKeyDown}
        className="carousel-control-button carousel-control-prev"
        aria-label="Previous slide"
        aria-controls={`${carouselId}-slide-${previousSlide + 1}`}
      >
        <ChevronLeft className="carousel-control-icon" />
      </button>

      <div className="carousel-navigation-status">
        <span className="carousel-page-count" aria-hidden="true">
          {String(currentSlide + 1).padStart(2, '0')} /{' '}
          {String(totalSlides).padStart(2, '0')}
        </span>

        <div
          className="carousel-indicators"
          role="group"
          aria-label="Choose a slide"
        >
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onGoToSlide(index)}
              onKeyDown={onKeyDown}
              className={`carousel-indicator ${
                index === currentSlide
                  ? 'carousel-indicator-active'
                  : 'carousel-indicator-inactive'
              }`}
              aria-label={`Show slide ${index + 1} of ${totalSlides}`}
              aria-controls={`${carouselId}-slide-${index + 1}`}
              aria-current={index === currentSlide ? 'page' : undefined}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        onKeyDown={onKeyDown}
        className="carousel-control-button carousel-control-next"
        aria-label="Next slide"
        aria-controls={`${carouselId}-slide-${nextSlide + 1}`}
      >
        <ChevronRight className="carousel-control-icon" />
      </button>
    </nav>
  );
}
