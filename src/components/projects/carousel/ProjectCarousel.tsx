import { useState, useEffect, useMemo } from 'react';
import { ProjectCard } from '../project-card/ProjectCard';
import { getProjectIconAndColors } from '../ProjectIconUtils';
import { CarouselControls } from './CarouselControls';
import './ProjectCarousel.css';

interface Project {
  id: string;
  title: string;
  description: string;
  short_description: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  image_url?: string;
  featured?: boolean;
}

interface ProjectCarouselProps {
  projects: Project[];
  featured?: boolean;
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

export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cardsPerSlide, setCardsPerSlide] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return getCardsPerSlideForWidth(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setCardsPerSlide(getCardsPerSlideForWidth(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const prevSlide = () => {
    if (slideCount === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToSlide = (index: number) => {
    if (slideCount === 0) return;
    setCurrentSlide(Math.max(0, Math.min(index, slideCount - 1)));
  };

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <div className="carousel-track">
          <div
            className="carousel-slides"
            style={{ transform: `translateX(-${currentSlideClamped * 100}%)` }}
          >
            {slides.map((slideProjects, slideIndex) => (
              <div key={slideIndex} className="carousel-slide">
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

        <CarouselControls
          onPrev={prevSlide}
          onNext={nextSlide}
          currentSlide={currentSlideClamped}
          totalSlides={slideCount}
          onGoToSlide={goToSlide}
        />
      </div>
    </div>
  );
}
