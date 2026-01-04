import { useState, useEffect, useRef } from 'react';
import { GitHubRepo } from '../../../types';
import { RepoCardHeader } from './RepoCardHeader';
import { RepoCardDescription } from './RepoCardDescription';
import { RepoCardFooter } from './RepoCardFooter';

interface RepoCardProps {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const description = repo.description || '';

  useEffect(() => {
    const measureOverflow = () => {
      const element = descriptionRef.current;
      if (!element) return;

      if (isExpanded) {
        // When expanded, check if it would overflow when collapsed
        element.classList.add('repo-card-description-clamped');
        const hasOverflow = element.scrollHeight > element.clientHeight;
        element.classList.remove('repo-card-description-clamped');
        setShouldShowToggle(hasOverflow);
      } else {
        // When collapsed, check if content overflows
        const hasOverflow = element.scrollHeight > element.clientHeight;
        setShouldShowToggle(hasOverflow);
      }
    };

    measureOverflow();
    window.addEventListener('resize', measureOverflow);
    return () => {
      window.removeEventListener('resize', measureOverflow);
    };
  }, [description, isExpanded]);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="repo-card group"
    >
      <RepoCardHeader name={repo.name} />
      <RepoCardDescription
        description={description}
        descriptionRef={descriptionRef}
        isExpanded={isExpanded}
        shouldShowToggle={shouldShowToggle}
        onToggle={handleToggleExpand}
      />
      <RepoCardFooter
        language={repo.language}
        stargazersCount={repo.stargazers_count}
      />
    </a>
  );
}
