import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');
const outputPath = path.join(
  repoRoot,
  'src/components/about/language-grid/Languages.generated.ts'
);

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

const LANGUAGE_COLORS = {
  Python: '#3572A5',
  'C++': '#f34b7d',
  C: '#555555',
  Shell: '#89e051',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Go: '#00ADD8',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Rust: '#dea584',
  Ruby: '#701516',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
};

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

    throw new Error(
      `GitHub API request failed (${response.status}) for ${url}`
    );
  }

  return response.json();
}

function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (idx < items.length) {
        const current = idx;
        idx += 1;
        results[current] = await fn(items[current], current);
      }
    });

  return Promise.all(workers).then(() => results);
}

async function fetchOwnedPublicRepos(username) {
  const perPage = 100;
  const repos = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/users/${username}/repos?sort=pushed&per_page=${perPage}&page=${page}`;
    const data = await githubFetch(url);
    repos.push(...data);
    if (data.length < perPage) break;
  }

  return repos.filter(
    (repo) =>
      repo?.owner?.login === username &&
      repo?.fork === false &&
      repo?.private !== true
  );
}

async function readExcludedLanguages() {
  const configPath = path.join(repoRoot, 'src/config/githubLanguages.ts');

  try {
    const raw = await readFile(configPath, 'utf8');
    const anchor = 'EXCLUDED_GITHUB_LANGUAGES';
    const anchorIndex = raw.indexOf(anchor);
    if (anchorIndex === -1) return [];

    const startBracket = raw.indexOf('[', anchorIndex);
    if (startBracket === -1) return [];

    const endBracket = raw.indexOf(']', startBracket);
    if (endBracket === -1) return [];

    const inside = raw.slice(startBracket + 1, endBracket);
    const values = [];
    const re = /'([^']*)'|"([^"]*)"/g;
    let match = re.exec(inside);

    while (match) {
      values.push(match[1] ?? match[2]);
      match = re.exec(inside);
    }

    return values.filter(Boolean);
  } catch {
    return [];
  }
}

function renderOutput(languages) {
  const contents = JSON.stringify(languages, null, 2).replace(
    /"([^"]+)":/g,
    '$1:'
  );

  return `export const FALLBACK_LANGUAGES: { name: string; color: string }[] = ${contents};
`;
}

async function main() {
  const username = 'dytsou';
  const excluded = new Set(await readExcludedLanguages());

  try {
    const repos = await fetchOwnedPublicRepos(username);
    const totals = new Map();

    await mapWithConcurrency(repos, 6, async (repo) => {
      const data = await githubFetch(repo.languages_url);
      for (const [lang, bytes] of Object.entries(data)) {
        if (excluded.has(lang)) continue;
        totals.set(lang, (totals.get(lang) ?? 0) + bytes);
      }
    });

    const top = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    const languages = top.map((name) => ({
      name,
      color: LANGUAGE_COLORS[name] ?? 'var(--accent)',
    }));
    const output = renderOutput(languages);
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
