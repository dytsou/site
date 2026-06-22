import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';
import { fetchOwnedPublicRepos } from './lib/github-api.mjs';
import { runScript, withGithubSync } from './lib/github-sync.mjs';

const outputPath = path.join(
  process.cwd(),
  'src/data/GitHubActivity.generated.ts'
);
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

await runScript(() =>
  withGithubSync(outputPath, async ({ apiOptions }) => {
    const ownedRepos = await fetchOwnedPublicRepos(username, apiOptions);
    const repos = ownedRepos.slice(0, 6).map(pickRepoFields);
    const output = renderOutput(repos);
    const formatted = await prettier.format(output, { parser: 'typescript' });
    await writeFile(outputPath, formatted);
  })
);
