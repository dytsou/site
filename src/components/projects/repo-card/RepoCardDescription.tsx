import { RefObject } from 'react';

interface RepoCardDescriptionProps {
  description: string;
  descriptionRef: RefObject<HTMLParagraphElement | null>;
  isExpanded: boolean;
  shouldShowToggle: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function RepoCardDescription({
  description,
  descriptionRef,
  isExpanded,
  shouldShowToggle,
  onToggle,
}: RepoCardDescriptionProps) {
  return (
    <div className="repo-card-description-wrapper">
      <p
        ref={descriptionRef}
        className={`repo-card-description ${!isExpanded ? 'repo-card-description-clamped' : ''}`}
      >
        {description}
      </p>
      {shouldShowToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="repo-card-more-button"
          aria-label={isExpanded ? 'See less' : 'See more'}
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}
