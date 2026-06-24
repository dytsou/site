import { TechTag } from '../../ui/TechTag';

interface ProjectTechnologiesProps {
  technologies?: string[];
  tags?: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ProjectTechnologies({
  technologies = [],
  tags = [],
  isExpanded,
  onToggle,
}: Readonly<ProjectTechnologiesProps>) {
  const visibleTechnologies = isExpanded
    ? technologies
    : technologies.slice(0, 5);
  const visibleTags = isExpanded ? tags : tags.slice(0, 5);

  const hasMore = technologies.length > 5 || tags.length > 5;
  const hiddenCount =
    Math.max(0, technologies.length - 5) + Math.max(0, tags.length - 5);
  const showToggle = hasMore;
  const showExpand = showToggle && !isExpanded;
  const showCollapse = showToggle && isExpanded;
  const showToggleInTagsRow = visibleTags.length > 0;
  const showToggleInTechRow =
    !showToggleInTagsRow && visibleTechnologies.length > 0;

  return (
    <div className="project-technologies">
      {visibleTechnologies.length > 0 && (
        <div className="project-technologies-row">
          {visibleTechnologies.map((tech: string) => (
            <TechTag key={tech} technology={tech} />
          ))}
          {showToggleInTechRow && showExpand && (
            <button
              type="button"
              onClick={onToggle}
              className="project-tech-more-button"
              aria-label={`Show ${hiddenCount} more technologies and tags`}
              aria-expanded={isExpanded}
            >
              +{hiddenCount}
            </button>
          )}
          {showToggleInTechRow && showCollapse && (
            <button
              type="button"
              onClick={onToggle}
              className="project-tech-less-button"
              aria-label="Collapse technologies and tags"
              aria-expanded={isExpanded}
            >
              Show less
            </button>
          )}
        </div>
      )}

      {visibleTags.length > 0 && (
        <div className="project-tags-row">
          {visibleTags.map((tag: string) => (
            <TechTag
              key={tag}
              technology={`#${tag}`}
              className="tech-tag-hashtag"
            />
          ))}
          {showToggleInTagsRow && showExpand && (
            <button
              type="button"
              onClick={onToggle}
              className="project-tech-more-button"
              aria-label={`Show ${hiddenCount} more technologies and tags`}
              aria-expanded={isExpanded}
            >
              +{hiddenCount}
            </button>
          )}
          {showToggleInTagsRow && showCollapse && (
            <button
              type="button"
              onClick={onToggle}
              className="project-tech-less-button"
              aria-label="Collapse technologies and tags"
              aria-expanded={isExpanded}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
