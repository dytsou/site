import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { Project } from '../../../types/projects';
import './ProjectCard.css';
import { ProjectCardHeader } from './ProjectCardHeader';
import { ProjectDescription } from './ProjectDescription';
import { ProjectTechnologies } from './ProjectTechnologies';
import { HEATMAP_PROJECTS } from '../../../../shared/heatmap-contract.js';
import { ProjectActions } from './ProjectActions';

interface ProjectCardProps {
  project: Project;
  projectIndex: number;
  heatmapSlide?: number;
  cardStyle: string;
  isMobile: boolean;
  getProjectIconAndColors: (project: Project) => {
    Icon: ComponentType<{ className?: string }>;
    iconClass: string;
  };
}

export function ProjectCard({
  project,
  projectIndex,
  heatmapSlide,
  cardStyle,
  isMobile,
  getProjectIconAndColors,
}: Readonly<ProjectCardProps>) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
    new Set()
  );
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set());
  const [shouldShowToggle, setShouldShowToggle] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const toggleDescription = (projectIndex: number) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectIndex)) {
        newSet.delete(projectIndex);
      } else {
        newSet.add(projectIndex);
      }
      return newSet;
    });
  };

  const toggleTags = (projectIndex: number) => {
    setExpandedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectIndex)) {
        newSet.delete(projectIndex);
      } else {
        newSet.add(projectIndex);
      }
      return newSet;
    });
  };

  const { Icon, iconClass } = getProjectIconAndColors(project);

  useEffect(() => {
    const measureOverflowCollapsed = () => {
      const element = descriptionRef.current;
      if (!element) return;

      const isExpanded = expandedDescriptions.has(projectIndex);

      if (isExpanded) {
        element.classList.add('project-description-collapsed');
        const hasOverflow = element.scrollHeight > element.clientHeight;
        element.classList.remove('project-description-collapsed');
        setShouldShowToggle(hasOverflow);
      } else {
        const hasOverflow = element.scrollHeight > element.clientHeight;
        setShouldShowToggle(hasOverflow);
      }
    };

    measureOverflowCollapsed();
    window.addEventListener('resize', measureOverflowCollapsed);
    return () => {
      window.removeEventListener('resize', measureOverflowCollapsed);
    };
  }, [project.description, projectIndex, expandedDescriptions]);

  const isDescriptionExpanded = expandedDescriptions.has(projectIndex);
  const isTagsExpanded = expandedTags.has(projectIndex);

  const heatmapProject = HEATMAP_PROJECTS.find(
    ({ sourceId }) => sourceId === project.id
  );
  const heatmapKey = heatmapProject?.key;

  return (
    <div
      data-heatmap-state={
        heatmapKey && heatmapSlide !== undefined
          ? `slide-${heatmapSlide}.description-${isDescriptionExpanded ? 'open' : 'closed'}.tags-${isTagsExpanded ? 'open' : 'closed'}`
          : undefined
      }
      className={`project-card stroke-icon-host ${isMobile ? 'project-card-mobile' : ''} ${cardStyle}`}
    >
      <div className="project-card-content">
        <div className="project-card-main">
          <div>
            <ProjectCardHeader
              Icon={Icon}
              iconClass={iconClass}
              title={project.title}
            />
            <ProjectDescription
              heatmapTarget={
                heatmapKey ? `project.${heatmapKey}.description` : undefined
              }
              description={project.description}
              descriptionRef={descriptionRef}
              isExpanded={isDescriptionExpanded}
              shouldShowToggle={shouldShowToggle}
              onToggle={() => toggleDescription(projectIndex)}
            />
          </div>

          <ProjectTechnologies
            heatmapTarget={
              heatmapKey ? `project.${heatmapKey}.tags` : undefined
            }
            technologies={project.technologies}
            tags={project.tags}
            isExpanded={isTagsExpanded}
            onToggle={() => toggleTags(projectIndex)}
          />
        </div>

        <ProjectActions
          heatmapTarget={
            heatmapKey ? `project.${heatmapKey}.github` : undefined
          }
          githubUrl={project.github_url}
        />
      </div>
    </div>
  );
}
