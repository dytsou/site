import { Github, ExternalLink } from 'lucide-react';

interface ProjectActionsProps {
  githubUrl?: string;
  liveUrl?: string;
}

export function ProjectActions({ githubUrl, liveUrl }: ProjectActionsProps) {
  if (!githubUrl && !liveUrl) return null;

  return (
    <div className="project-actions">
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="project-action-button project-action-github"
        >
          <Github className="project-action-icon" />
          Code
        </a>
      )}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="project-action-button project-action-demo"
        >
          <ExternalLink className="project-action-icon" />
          Demo
        </a>
      )}
    </div>
  );
}
