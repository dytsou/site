import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import {
  fetchOwnedPublicRepos,
  fileExists,
  isRetriableGithubError,
  resolveGithubConfig,
} from './lib/github-api.mjs';

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, 'src/data/GitHubActivity.generated.ts');
const username = 'dytsou';

function pickRepoFields(repo) {
  return {
    name: repo.name ?? '',
    description: repo.description ?? '',
    html_url: repo.html_url ?? '',
    stargazers_count: Number(repo.stargazers_count) || 0,
    language: repo.language ?? null,
  };
}

function renderOutput(repos) {
  const body = JSON.stringify(repos, null, 2);
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

async function main() {
  const { getToken, offlineMode } = resolveGithubConfig();
  const token = await getToken();

  try {
    const ownedRepos = await fetchOwnedPublicRepos(username, {
      token,
      offlineMode,
    });
    const repos = ownedRepos.slice(0, 6).map(pickRepoFields);
    const output = renderOutput(repos);
    const formatted = await prettier.format(output, { parser: 'typescript' });
    await writeFile(outputPath, formatted);
    console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    const hasOutput = await fileExists(outputPath);
    const message = error instanceof Error ? error.message : String(error);

    if (hasOutput && isRetriableGithubError(error, Boolean(token))) {
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
