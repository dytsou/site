import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');
const outputPath = path.join(repoRoot, 'src/components/about/AboutStats.generated.ts');

async function readDotEnv(filePath) {
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

const dotEnv = await readDotEnv(envPath);
const githubToken = process.env.GITHUB_TOKEN || dotEnv.GITHUB_TOKEN;
const offlineMode =
  process.env.NO_GITHUB_API === '1' || process.env.NO_GITHUB_API === 'true';

async function fileExists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function githubFetch(url) {
  if (offlineMode) {
    const error = new Error(`Offline mode: skipping GitHub API for ${url}`);
    error.name = 'GitHubOfflineMode';
    throw error;
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
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

    throw new Error(`GitHub API request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

function renderOutput(publicRepos) {
  const value =
    typeof publicRepos === 'number' && Number.isFinite(publicRepos)
      ? String(publicRepos)
      : 'undefined';

  return `export const FALLBACK_PUBLIC_REPOS: number | undefined = ${value};
`;
}

async function main() {
  const username = 'dytsou';

  try {
    const user = await githubFetch(`https://api.github.com/users/${username}`);
    const output = renderOutput(user?.public_repos);
    await writeFile(outputPath, output);
    console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    const hasOutput = await fileExists(outputPath);
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimited =
      error instanceof Error && error.name === 'GitHubRateLimitError';
    const isOfflineMode =
      error instanceof Error && error.name === 'GitHubOfflineMode';

    if (hasOutput && (isRateLimited || isOfflineMode || !githubToken)) {
      console.warn(
        `Warning: ${message}. Using existing ${path.relative(repoRoot, outputPath)}`
      );
      return;
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

