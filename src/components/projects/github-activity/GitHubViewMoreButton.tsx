import { Github } from '../../icons/brandSocialIcons';

interface GitHubViewMoreButtonProps {
  githubUrl: string;
}

export function GitHubViewMoreButton({ githubUrl }: GitHubViewMoreButtonProps) {
  return (
    <div className="github-button-container">
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="github-button"
      >
        <Github className="github-button-icon" />
        View More on GitHub
      </a>
    </div>
  );
}
