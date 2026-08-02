import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');

export async function readDotEnv(filePath = envPath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key) env[key] = value;
    }

    return env;
  } catch {
    return {};
  }
}

export async function fileExists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function resolveGithubConfig() {
  return {
    getToken: async () => {
      if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
      if (process.env.CI === 'true') return undefined;
      const env = await readDotEnv();
      return env.GITHUB_TOKEN;
    },
    offlineMode:
      process.env.NO_GITHUB_API === '1' || process.env.NO_GITHUB_API === 'true',
  };
}

export async function githubFetch(url, { token, offlineMode }) {
  if (offlineMode) {
    const error = new Error(`Offline mode: skipping GitHub API for ${url}`);
    error.name = 'GitHubOfflineMode';
    throw error;
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (response.status === 403 && remaining === '0') {
      const resetSeconds = reset ? Number(reset) : null;
      const resetAt = resetSeconds ? new Date(resetSeconds * 1000) : null;
      const resetMessage = resetAt
        ? ` (rate limit resets at ${resetAt.toISOString()})`
        : '';

      const error = new Error(
        `GitHub API rate-limited for ${url}${resetMessage}`
      );
      error.name = 'GitHubRateLimitError';
      throw error;
    }

    throw new Error(
      `GitHub API request failed (${response.status}) for ${url}`
    );
  }

  return response.json();
}

export async function fetchOwnedPublicRepos(username, { token, offlineMode }) {
  const perPage = 100;
  const collected = [];

  for (let page = 1; page <= 10; page += 1) {
    const data = await githubFetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=${perPage}&page=${page}`,
      { token, offlineMode }
    );
    collected.push(...data);
    if (data.length < perPage) break;
  }

  return collected.filter(
    (repo) => repo.owner?.login === username && !repo.fork && !repo.private
  );
}

export function isRetriableGithubError(error, hasToken) {
  const isRateLimited =
    error instanceof Error && error.name === 'GitHubRateLimitError';
  const isOfflineMode =
    error instanceof Error && error.name === 'GitHubOfflineMode';
  const isTopLangsUnavailable =
    error instanceof Error && error.name === 'TopLangsUnavailableError';
  return isRateLimited || isOfflineMode || isTopLangsUnavailable || !hasToken;
}
