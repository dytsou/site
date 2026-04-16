import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');
const sourcesPath = path.join(
  repoRoot,
  'src/components/contents/projects.sources.json'
);
const outputPath = path.join(
  repoRoot,
  'src/components/contents/Projects.generated.ts'
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

async function readSources() {
  const raw = await readFile(sourcesPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('projects.sources.json must contain an array');
  }

  return parsed;
}

async function fileExists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function stripOrderIndexFromGenerated() {
  const hasOutput = await fileExists(outputPath);
  if (!hasOutput) return false;

  const existing = await readFile(outputPath, 'utf8');
  const next = existing.replace(/^\s*order_index:\s*[^,\n]+,\s*$/gm, '');

  if (next === existing) return false;

  await writeFile(outputPath, next);
  return true;
}

function parseRepoUrl(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);

  if (parsed.hostname !== 'github.com' || parts.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ''),
  };
}

async function githubFetch(endpoint) {
  if (offlineMode) {
    const error = new Error(
      `Offline mode: skipping GitHub API for ${endpoint}`
    );
    error.name = 'GitHubOfflineMode';
    throw error;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
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
        `GitHub API rate-limited for ${endpoint}${resetMessage}`
      );
      error.name = 'GitHubRateLimitError';
      throw error;
    }

    throw new Error(
      `GitHub API request failed (${response.status}) for ${endpoint}`
    );
  }

  return response.json();
}

function uniquePreservingOrder(items) {
  return [...new Set(items.filter(Boolean))];
}

function toTitleCaseFromRepoName(repoName) {
  return repoName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function rankLanguages(languageMap) {
  return Object.entries(languageMap)
    .sort(([, a], [, b]) => b - a)
    .map(([language]) => language);
}

function buildTechnologies(source, repoData, languageMap) {
  if (source.technologies?.length) {
    return uniquePreservingOrder(source.technologies);
  }

  return uniquePreservingOrder([
    repoData.language,
    ...rankLanguages(languageMap).slice(0, 4),
  ]);
}

function buildTags(source, repoData) {
  if (source.tags?.length) {
    return uniquePreservingOrder(source.tags);
  }

  return uniquePreservingOrder(repoData.topics ?? []);
}

function buildDescription(source, repoData) {
  return (
    source.description?.trim() ||
    repoData.description?.trim() ||
    `View ${repoData.name} on GitHub.`
  );
}

function buildProjectOffline(source) {
  const { owner, repo } = parseRepoUrl(source.url);
  const title =
    source.title?.trim() || toTitleCaseFromRepoName(repo ?? 'Repository');

  return {
    id: `${owner}/${repo}`,
    title,
    description: source.description?.trim() ?? '',
    technologies: uniquePreservingOrder(source.technologies ?? []),
    tags: uniquePreservingOrder(source.tags ?? []),
    github_url: source.url,
    featured: source.featured ?? false,
  };
}

function renderOutput(projects) {
  const contents = JSON.stringify(projects, null, 2).replace(
    /"([^"]+)":/g,
    '$1:'
  );

  return `import type { Project } from '../../types/projects';

export const PROJECTS_CONTENTS: Project[] = ${contents} as Project[];
`;
}

async function buildProject(source) {
  if (offlineMode) {
    return buildProjectOffline(source);
  }

  const { owner, repo } = parseRepoUrl(source.url);
  const [repoData, languageMap] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}`),
    githubFetch(`/repos/${owner}/${repo}/languages`),
  ]);

  return {
    id: `${owner}/${repo}`,
    title: source.title?.trim() || toTitleCaseFromRepoName(repoData.name),
    description: buildDescription(source, repoData),
    technologies: buildTechnologies(source, repoData, languageMap),
    tags: buildTags(source, repoData),
    github_url: repoData.html_url,
    featured: source.featured ?? false,
  };
}

async function main() {
  const sources = await readSources();
  try {
    const projects = await Promise.all(sources.map(buildProject));
    const output = renderOutput(projects);

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
      await stripOrderIndexFromGenerated();
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
