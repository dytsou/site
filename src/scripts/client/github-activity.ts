const GITHUB_USERNAME = 'dytsou';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
const MAX_REPOSITORIES = 6;
const MAX_API_PAGES = 10;
const API_PAGE_SIZE = 100;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

type GithubApiRepo = {
  name?: string | null;
  description?: string | null;
  html_url?: string | null;
  stargazers_count?: number | null;
  language?: string | null;
  fork?: boolean;
  private?: boolean;
  owner?: {
    login?: string | null;
  } | null;
};

type GithubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

function isOwnedPublicRepository(repo: GithubApiRepo): boolean {
  return (
    repo.owner?.login?.toLowerCase() === GITHUB_USERNAME &&
    repo.fork !== true &&
    repo.private !== true
  );
}

function isGithubRepositoryUrl(value: string): boolean {
  return value.startsWith(`https://github.com/${GITHUB_USERNAME}/`);
}

function toActivityRepo(repo: GithubApiRepo): GithubActivityRepo | null {
  const name = repo.name?.trim() ?? '';
  const htmlUrl = repo.html_url?.trim() ?? '';

  if (!name || !isGithubRepositoryUrl(htmlUrl)) return null;

  return {
    name,
    description: repo.description?.trim() ?? '',
    html_url: htmlUrl,
    stargazers_count: Number(repo.stargazers_count) || 0,
    language: repo.language?.trim() || null,
  };
}

async function fetchLatestRepositories(): Promise<GithubActivityRepo[]> {
  const repositories: GithubActivityRepo[] = [];

  for (let page = 1; page <= MAX_API_PAGES; page += 1) {
    const response = await fetch(
      `${GITHUB_API_URL}?sort=pushed&per_page=${API_PAGE_SIZE}&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API request failed with status ${response.status}`
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error('GitHub API returned an unexpected response');
    }

    for (const repo of payload as GithubApiRepo[]) {
      if (!isOwnedPublicRepository(repo)) continue;

      const activityRepo = toActivityRepo(repo);
      if (activityRepo) repositories.push(activityRepo);
      if (repositories.length === MAX_REPOSITORIES) return repositories;
    }

    if (payload.length < API_PAGE_SIZE) break;
  }

  return repositories;
}

function setSvgAttributes(
  svg: SVGElement,
  className: string,
  size: string
): void {
  svg.setAttribute('class', className);
  svg.setAttribute('xmlns', SVG_NAMESPACE);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
}

function createGithubIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  setSvgAttributes(svg, 'repo-card-icon', '20');

  const paths = [
    'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
    'M9 18c-4.51 2-5-2-7-2',
  ];

  for (const pathData of paths) {
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    path.setAttribute('d', pathData);
    svg.append(path);
  }

  return svg;
}

function createStarIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  setSvgAttributes(svg, 'star-icon', '16');

  const polygon = document.createElementNS(SVG_NAMESPACE, 'polygon');
  polygon.setAttribute(
    'points',
    '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'
  );
  svg.append(polygon);

  return svg;
}

function createRepositoryCard(repo: GithubActivityRepo): HTMLAnchorElement {
  const card = document.createElement('a');
  card.href = repo.html_url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.className = 'repo-card group';

  const header = document.createElement('div');
  header.className = 'repo-card-header';

  const title = document.createElement('h4');
  title.className = 'repo-card-title';
  title.textContent = repo.name;
  header.append(title, createGithubIcon());

  const descriptionWrapper = document.createElement('div');
  descriptionWrapper.className = 'repo-card-description-wrapper';

  const description = document.createElement('p');
  description.className = 'repo-card-description repo-card-description-clamped';
  description.textContent = repo.description;
  descriptionWrapper.append(description);

  const footer = document.createElement('div');
  footer.className = 'repo-card-footer';

  if (repo.language) {
    const language = document.createElement('span');
    language.className = 'language-indicator';

    const languageDot = document.createElement('span');
    languageDot.className = 'language-dot';
    language.append(languageDot, document.createTextNode(repo.language));
    footer.append(language);
  }

  const stars = document.createElement('span');
  stars.className = 'star-indicator';
  stars.append(
    createStarIcon(),
    document.createTextNode(String(repo.stargazers_count))
  );
  footer.append(stars);

  card.append(header, descriptionWrapper, footer);
  return card;
}

function refreshActivity(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-github-repos]');
  const status = root.querySelector<HTMLElement>(
    '[data-github-activity-status]'
  );
  if (!grid) return;

  void fetchLatestRepositories()
    .then((repositories) => {
      if (repositories.length === 0) return;

      grid.replaceChildren(...repositories.map(createRepositoryCard));
      if (status) status.textContent = 'GitHub activity updated.';
    })
    .catch(() => {
      // Keep the statically generated cards visible when GitHub is unavailable.
      if (status) status.textContent = 'Showing cached GitHub activity.';
    });
}

function initGithubActivity(): void {
  document
    .querySelectorAll<HTMLElement>('[data-github-activity]')
    .forEach(refreshActivity);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGithubActivity, {
    once: true,
  });
} else {
  initGithubActivity();
}
