import { useState, useEffect, useMemo, useId, type KeyboardEvent } from 'react';
import type { Project } from '../../../types/projects';
import { ProjectCard } from '../project-card/ProjectCard';
import { getProjectIconAndColors } from '../ProjectIconUtils';
import { CarouselControls } from './CarouselControls';
import './ProjectCarousel.css';

interface ProjectCarouselProps {
  projects: Project[];
}

const CARD_STYLES = [
  'card-style-primary',
  'card-style-secondary',
  'card-style-tertiary',
];

const getCardsPerSlideForWidth = (width: number) => {
  if (width >= 1440) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
};

export function ProjectCarousel({ projects }: Readonly<ProjectCarouselProps>) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselId = useId();
  // ponytail: always 1 on SSR/first paint; useEffect sets viewport-aware layout after hydration.
  const [cardsPerSlide, setCardsPerSlide] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setCardsPerSlide(getCardsPerSlideForWidth(globalThis.window.innerWidth));
    };

    handleResize();
    globalThis.window.addEventListener('resize', handleResize);
    return () => globalThis.window.removeEventListener('resize', handleResize);
  }, []);

  const slides = useMemo(() => {
    if (projects.length === 0) return [];
    const groups: Project[][] = [];
    for (let i = 0; i < projects.length; i += cardsPerSlide) {
      groups.push(projects.slice(i, i + cardsPerSlide));
    }
    return groups;
  }, [projects, cardsPerSlide]);

  const slideCount = slides.length;
  const isSingleColumn = cardsPerSlide === 1;

  if (slideCount === 0) return null;

  const currentSlideClamped = Math.min(
    currentSlide,
    Math.max(slideCount - 1, 0)
  );

  const nextSlide = () => {
    if (slideCount === 0) return;
    setCurrentSlide((currentSlideClamped + 1) % slideCount);
  };

  const prevSlide = () => {
    if (slideCount === 0) return;
    setCurrentSlide((currentSlideClamped - 1 + slideCount) % slideCount);
  };

  const goToSlide = (index: number) => {
    if (slideCount === 0) return;
    setCurrentSlide(Math.max(0, Math.min(index, slideCount - 1)));
  };

  const handleCarouselKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (slideCount === 0) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(slideCount - 1);
    }
  };

  return (
    <div className="carousel-container">
      <section
        className="carousel-wrapper"
        aria-roledescription="carousel"
        aria-label="Featured projects"
      >
        <div className="carousel-track">
          <div
            className="carousel-slides"
            style={{ transform: `translateX(-${currentSlideClamped * 100}%)` }}
          >
            {slides.map((slideProjects, slideIndex) => (
              <div
                key={slideProjects.map((project) => project.id).join('/')}
                id={`${carouselId}-slide-${slideIndex + 1}`}
                className="carousel-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${slideIndex + 1} of ${slideCount}`}
                aria-hidden={slideIndex !== currentSlideClamped}
                inert={slideIndex !== currentSlideClamped || undefined}
              >
                <div
                  className={`carousel-slide-content ${isSingleColumn ? 'single-column' : 'multi-column'}`}
                  style={
                    isSingleColumn
                      ? undefined
                      : {
                          gridTemplateColumns: `repeat(${Math.min(cardsPerSlide, slideProjects.length)}, minmax(0, 1fr))`,
                        }
                  }
                >
                  {slideProjects.map((project, projectIdx) => {
                    const globalIndex = slideIndex * cardsPerSlide + projectIdx;
                    const cardStyle =
                      CARD_STYLES[globalIndex % CARD_STYLES.length];
                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        projectIndex={globalIndex}
                        cardStyle={cardStyle}
                        isMobile={isSingleColumn}
                        getProjectIconAndColors={getProjectIconAndColors}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Showing projects {currentSlideClamped + 1} of {slideCount}
        </p>

        <CarouselControls
          onPrev={prevSlide}
          onNext={nextSlide}
          currentSlide={currentSlideClamped}
          totalSlides={slideCount}
          onGoToSlide={goToSlide}
          onKeyDown={handleCarouselKeyDown}
          carouselId={carouselId}
        />
      </section>
    </div>
  );
}
