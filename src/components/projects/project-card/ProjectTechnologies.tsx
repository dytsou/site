import { TechTag } from '../../ui/TechTag';

interface ProjectTechnologiesProps {
  technologies: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ProjectTechnologies({
  technologies,
  isExpanded,
  onToggle,
}: ProjectTechnologiesProps) {
  const visibleTechnologies = isExpanded
    ? technologies
    : technologies.slice(0, 5);
  const hasMore = technologies.length > 5;

  return (
    <div className="project-technologies">
      {visibleTechnologies.map((tech: string, index: number) => (
        <TechTag key={index} technology={tech} />
      ))}
      {hasMore && !isExpanded && (
        <button onClick={onToggle} className="project-tech-more-button">
          +{technologies.length - 5} more
        </button>
      )}
      {hasMore && isExpanded && (
        <button onClick={onToggle} className="project-tech-less-button">
          Show less
        </button>
      )}
    </div>
  );
}
