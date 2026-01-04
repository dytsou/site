import { Star } from 'lucide-react';

interface RepoCardFooterProps {
  language?: string;
  stargazersCount: number;
}

export function RepoCardFooter({
  language,
  stargazersCount,
}: RepoCardFooterProps) {
  return (
    <div className="repo-card-footer">
      {language && (
        <span className="language-indicator">
          <span className="language-dot"></span>
          {language}
        </span>
      )}
      <span className="star-indicator">
        <Star className="star-icon" />
        {stargazersCount}
      </span>
    </div>
  );
}
