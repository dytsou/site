import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ProjectCarousel.css';

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  currentSlide: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
}

export function CarouselControls({
  onPrev,
  onNext,
  currentSlide,
  totalSlides,
  onGoToSlide,
}: CarouselControlsProps) {
  return (
    <>
      <button
        onClick={onPrev}
        className="carousel-control-button carousel-control-prev"
        aria-label="Previous slide"
      >
        <ChevronLeft className="carousel-control-icon" />
      </button>

      <button
        onClick={onNext}
        className="carousel-control-button carousel-control-next"
        aria-label="Next slide"
      >
        <ChevronRight className="carousel-control-icon" />
      </button>

      <div className="carousel-indicators">
        {Array.from({ length: totalSlides }, (_, index) => (
          <button
            key={index}
            onClick={() => onGoToSlide(index)}
            className={`carousel-indicator ${
              index === currentSlide
                ? 'carousel-indicator-active'
                : 'carousel-indicator-inactive'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  );
}
