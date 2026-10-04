import type { RefObject } from 'react';

interface ProjectDescriptionProps {
  heatmapTarget?: string;
  description: string;
  descriptionRef: RefObject<HTMLParagraphElement | null>;
  isExpanded: boolean;
  shouldShowToggle: boolean;
  onToggle: () => void;
}

export function ProjectDescription({
  heatmapTarget,
  description,
  descriptionRef,
  isExpanded,
  shouldShowToggle,
  onToggle,
}: Readonly<ProjectDescriptionProps>) {
  return (
    <div className="project-description-container">
      <p
        ref={descriptionRef}
        className={`project-description ${isExpanded ? '' : 'project-description-collapsed'}`}
      >
        {description}
      </p>
      {shouldShowToggle && (
        <button
          type="button"
          data-heatmap-target={heatmapTarget}
          data-heatmap-preview-action="toggle"
          onClick={onToggle}
          className="project-description-toggle"
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}
