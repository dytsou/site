import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchOwnedPublicRepos, githubFetch } from './lib/github-api.mjs';
import { runScript, withGithubSync } from './lib/github-sync.mjs';

const repoRoot = process.cwd();
const outputPath = path.join(
  repoRoot,
  'src/components/about/language-grid/Languages.generated.ts'
);

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

await runScript(() =>
  withGithubSync(outputPath, async ({ apiOptions }) => {
    const username = 'dytsou';
    const excluded = new Set(await readExcludedLanguages());
    const repos = await fetchOwnedPublicRepos(username, apiOptions);
    const totals = new Map();

    await mapWithConcurrency(repos, 6, async (repo) => {
      const data = await githubFetch(repo.languages_url, apiOptions);
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
    await writeFile(outputPath, renderOutput(languages));
  })
);
