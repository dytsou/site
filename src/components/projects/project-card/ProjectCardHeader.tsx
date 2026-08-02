import { useLayoutEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import { prepStrokeIcons } from '../../../scripts/client/stroke-icon-prep';

interface ProjectCardHeaderProps {
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
}

export function ProjectCardHeader({
  Icon,
  iconClass,
  title,
}: Readonly<ProjectCardHeaderProps>) {
  const iconWrapRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (iconWrapRef.current) prepStrokeIcons(iconWrapRef.current);
  }, [Icon, iconClass]);

  return (
    <h3 className="project-title">
      <span className="project-title-content">
        <span ref={iconWrapRef} className="project-icon-wrap">
          <Icon className={`project-icon stroke-icon ${iconClass}`} />
        </span>
        <span>{title}</span>
      </span>
    </h3>
  );
}
