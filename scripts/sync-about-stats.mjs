import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  fileExists,
  githubFetch,
  isRetriableGithubError,
  resolveGithubConfig,
} from './lib/github-api.mjs';

const repoRoot = process.cwd();
const outputPath = path.join(
  repoRoot,
  'src/components/about/AboutStats.generated.ts'
);

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
  const { getToken, offlineMode } = resolveGithubConfig();
  const token = await getToken();
  const apiOptions = { token, offlineMode };

  try {
    const user = await githubFetch(
      `https://api.github.com/users/${username}`,
      apiOptions
    );
    const output = renderOutput(user?.public_repos);
    await writeFile(outputPath, output);
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
