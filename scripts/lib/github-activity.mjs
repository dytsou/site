export const GITHUB_ACTIVITY_USERNAME = 'dytsou';
export const MAX_GITHUB_ACTIVITY_REPOSITORIES = 6;

function isOwnedPublicRepository(repo) {
  return (
    repo?.owner?.login?.toLowerCase() === GITHUB_ACTIVITY_USERNAME &&
    repo.fork !== true &&
    repo.private !== true
  );
}

function pickRepoFields(repo) {
  return {
    name: repo.name ?? '',
    description: repo.description ?? '',
    html_url: repo.html_url ?? '',
    stargazers_count: Number(repo.stargazers_count) || 0,
    language: repo.language ?? null,
  };
}

export function selectGitHubActivityRepositories(repositories) {
  if (!Array.isArray(repositories)) {
    throw new TypeError('GitHub activity source must be an array');
  }

  return repositories
    .filter(isOwnedPublicRepository)
    .slice(0, MAX_GITHUB_ACTIVITY_REPOSITORIES)
    .map(pickRepoFields);
}

export function validateGitHubActivitySnapshot(repositories) {
  if (!Array.isArray(repositories)) {
    throw new TypeError('GitHub activity snapshot must be an array');
  }

  if (repositories.length === 0) {
    throw new Error(
      'GitHub activity snapshot must contain at least one repository'
    );
  }

  if (repositories.length > MAX_GITHUB_ACTIVITY_REPOSITORIES) {
    throw new Error(
      `GitHub activity snapshot cannot contain more than ${MAX_GITHUB_ACTIVITY_REPOSITORIES} repositories`
    );
  }

  for (const repo of repositories) {
    if (!repo || typeof repo !== 'object') {
      throw new Error(
        'GitHub activity snapshot contains an invalid repository'
      );
    }

    if (
      typeof repo.name !== 'string' ||
      repo.name.trim() === '' ||
      typeof repo.description !== 'string' ||
      typeof repo.html_url !== 'string' ||
      !repo.html_url.startsWith(
        `https://github.com/${GITHUB_ACTIVITY_USERNAME}/`
      ) ||
      !Number.isInteger(repo.stargazers_count) ||
      repo.stargazers_count < 0 ||
      (repo.language !== null && typeof repo.language !== 'string')
    ) {
      throw new Error(
        `GitHub activity snapshot contains invalid repository data`
      );
    }
  }

  return repositories;
}

export function renderGitHubActivityTypeScript(repositories) {
  validateGitHubActivitySnapshot(repositories);
  const body = JSON.stringify(repositories, null, 2);

  return `export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = ${body};
`;
}
