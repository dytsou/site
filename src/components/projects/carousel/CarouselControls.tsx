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
}

export function CarouselControls({
  onPrev,
  onNext,
  currentSlide,
  totalSlides,
  onGoToSlide,
  onKeyDown,
}: Readonly<CarouselControlsProps>) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        onKeyDown={onKeyDown}
        className="carousel-control-button carousel-control-prev"
        aria-label="Previous slide"
      >
        <ChevronLeft className="carousel-control-icon" />
      </button>

      <button
        type="button"
        onClick={onNext}
        onKeyDown={onKeyDown}
        className="carousel-control-button carousel-control-next"
        aria-label="Next slide"
      >
        <ChevronRight className="carousel-control-icon" />
      </button>

      <div className="carousel-indicators">
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
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? 'true' : undefined}
          />
        ))}
      </div>
    </>
  );
}
