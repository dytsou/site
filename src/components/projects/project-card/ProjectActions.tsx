import { Github } from '../../icons/brandSocialIcons';

interface ProjectActionsProps {
  heatmapTarget?: string;
  githubUrl?: string;
}

export function ProjectActions({
  githubUrl,
  heatmapTarget,
}: Readonly<ProjectActionsProps>) {
  if (!githubUrl) return null;

  return (
    <div className="project-actions">
      {githubUrl && (
        <a
          href={githubUrl}
          data-heatmap-target={heatmapTarget}
          target="_blank"
          rel="noopener noreferrer"
          className="project-action-button project-action-github"
        >
          <Github className="project-action-icon" />
          Code
        </a>
      )}
    </div>
  );
}
