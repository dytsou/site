import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { githubFetch } from './lib/github-api.mjs';
import { runScript, withGithubSync } from './lib/github-sync.mjs';

const outputPath = path.join(
  process.cwd(),
  'src/components/about/AboutStats.generated.ts'
);
const username = 'dytsou';

function renderOutput(publicRepos) {
  const value =
    typeof publicRepos === 'number' && Number.isFinite(publicRepos)
      ? String(publicRepos)
      : 'undefined';

  return `export const FALLBACK_PUBLIC_REPOS: number | undefined = ${value};
`;
}

await runScript(() =>
  withGithubSync(outputPath, async ({ apiOptions }) => {
    const user = await githubFetch(
      `https://api.github.com/users/${username}`,
      apiOptions
    );
    await writeFile(outputPath, renderOutput(user?.public_repos));
  })
);
