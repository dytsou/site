import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import {
  fileExists,
  githubFetch,
  isRetriableGithubError,
  resolveGithubConfig,
} from './lib/github-api.mjs';

const repoRoot = process.cwd();
const sourcesPath = path.join(
  repoRoot,
  'src/components/contents/projects.sources.json'
);
const outputPath = path.join(
  repoRoot,
  'src/components/contents/Projects.generated.ts'
);

async function readSources() {
  const raw = await readFile(sourcesPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('projects.sources.json must contain an array');
  }

  return parsed;
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

async function formatGeneratedTypeScript(code, filePath) {
  const config = await prettier.resolveConfig(filePath);
  return prettier.format(code, { ...(config ?? {}), filepath: filePath });
}

async function buildProject(source, { token, offlineMode }) {
  if (offlineMode) {
    return buildProjectOffline(source);
  }

  const { owner, repo } = parseRepoUrl(source.url);
  const apiOptions = { token, offlineMode };
  const [repoData, languageMap] = await Promise.all([
    githubFetch(`https://api.github.com/repos/${owner}/${repo}`, apiOptions),
    githubFetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      apiOptions
    ),
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
  const { getToken, offlineMode } = resolveGithubConfig();
  const token = await getToken();
  const sources = await readSources();
  try {
    const projects = await Promise.all(
      sources.map((source) => buildProject(source, { token, offlineMode }))
    );
    const output = renderOutput(projects);

    const formatted = await formatGeneratedTypeScript(output, outputPath);
    await writeFile(outputPath, formatted);
    console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    const hasOutput = await fileExists(outputPath);
    const message = error instanceof Error ? error.message : String(error);
    if (hasOutput && isRetriableGithubError(error, Boolean(token))) {
      await stripOrderIndexFromGenerated();
      console.warn(
        `Warning: ${message}. Using existing ${path.relative(repoRoot, outputPath)}`
      );
      return;
    }

    throw error;
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
