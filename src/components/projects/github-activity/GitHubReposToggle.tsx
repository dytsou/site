import { ChevronDown, ChevronUp } from 'lucide-react';

interface GitHubReposToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function GitHubReposToggle({
  isExpanded,
  onToggle,
}: GitHubReposToggleProps) {
  return (
    <div className="github-repos-toggle-container">
      <button
        onClick={onToggle}
        className="github-repos-toggle-button"
        aria-label={
          isExpanded ? 'Collapse repositories' : 'Expand repositories'
        }
      >
        {isExpanded ? (
          <ChevronUp className="github-repos-toggle-icon" />
        ) : (
          <ChevronDown className="github-repos-toggle-icon" />
        )}
      </button>
    </div>
  );
}
