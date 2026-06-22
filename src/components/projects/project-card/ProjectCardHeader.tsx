import type { ComponentType } from 'react';

interface ProjectCardHeaderProps {
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
}

export function ProjectCardHeader({
  Icon,
  iconClass,
  title,
}: ProjectCardHeaderProps) {
  return (
    <h3 className="project-title">
      <span className="project-title-content">
        <Icon className={`project-icon ${iconClass}`} />
        <span>{title}</span>
      </span>
    </h3>
  );
}
