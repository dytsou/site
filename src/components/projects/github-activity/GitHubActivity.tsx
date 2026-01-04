import { useState, useEffect } from 'react';
import { GitHubRepo } from '../../../types';
import './GitHubActivity.css';
import { RepoCard } from '../repo-card/RepoCard';
import { GitHubActivityHeader } from './GitHubActivityHeader';
import { GitHubViewMoreButton } from './GitHubViewMoreButton';
import { GitHubReposToggle } from './GitHubReposToggle';

interface GitHubActivityProps {
  repos: GitHubRepo[];
  loading: boolean;
}

export function GitHubActivity({ repos, loading }: GitHubActivityProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showAllRepos, setShowAllRepos] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading || repos.length === 0) {
    return null;
  }

  const displayRepos = repos.slice(0, 6);
  const initialReposCount = isMobile ? 2 : displayRepos.length;
  const reposToShow =
    isMobile && !showAllRepos
      ? displayRepos.slice(0, initialReposCount)
      : displayRepos;
  const hasMoreRepos =
    isMobile && displayRepos.length > initialReposCount && !showAllRepos;
  const showLessButton =
    isMobile && showAllRepos && displayRepos.length > initialReposCount;

  return (
    <div className="github-activity">
      <GitHubActivityHeader />
      <div className="github-repos-grid">
        {reposToShow.map((repo) => (
          <RepoCard key={repo.name} repo={repo} />
        ))}
      </div>
      {(!isMobile || showAllRepos) && (
        <GitHubViewMoreButton githubUrl="https://github.com/dytsou" />
      )}
      {(hasMoreRepos || showLessButton) && (
        <GitHubReposToggle
          isExpanded={showAllRepos}
          onToggle={() => setShowAllRepos(!showAllRepos)}
        />
      )}
    </div>
  );
}
