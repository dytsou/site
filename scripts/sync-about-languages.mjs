import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
  CSS: '#663399',
  HTML: '#e34c26',
  Rust: '#dea584',
  Ruby: '#701516',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
};

const DEFAULT_TOP_LANGS_URL =
  'https://github-readme-stats.tsou.me/api/top-langs/?username=dytsou&hide=jupyter%20notebook,cmake,tex&langs_count=8&size_weight=0.4&count_weight=0.6&hide_progress=true&theme=tokyonight';

async function readTopLangsUrl() {
  const configPath = path.join(repoRoot, 'src/config/githubLanguages.ts');
  try {
    const raw = await readFile(configPath, 'utf8');
    const match = raw.match(/GITHUB_TOP_LANGS_URL\s*=\s*'([^']+)'/);
    return match?.[1] ?? DEFAULT_TOP_LANGS_URL;
  } catch {
    return DEFAULT_TOP_LANGS_URL;
  }
}

/** Compact card lists langs column-first in SVG order = rank order. */
function parseLangNamesFromSvg(svg) {
  const names = [];
  const re = /data-testid="lang-name"[^>]*>([^<]*)</g;
  let match = re.exec(svg);
  while (match) {
    const name = match[1].trim();
    if (name) names.push(name);
    match = re.exec(svg);
  }
  return names;
}

function parseLangColorsFromSvg(svg) {
  /** @type {Map<string, string>} */
  const colors = new Map();
  // Nearest lang-name after each filled circle (index scan — no [\s\S]*? backtracking).
  const circleRe = /<circle\b[^>]*\bfill="(#[0-9A-Fa-f]+)"[^>]*>/gi;
  const nameRe = /data-testid="lang-name"[^>]*>([^<]*)</;
  let match = circleRe.exec(svg);
  while (match) {
    const nameMatch = nameRe.exec(svg.slice(match.index + match[0].length));
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (name) colors.set(name, match[1]);
    }
    match = circleRe.exec(svg);
  }
  return colors;
}

function renderOutput(languages) {
  const contents = JSON.stringify(languages, null, 2).replace(
    /"([^"]+)":/g,
    '$1:'
  );

  return `export const FALLBACK_LANGUAGES: { name: string; color: string }[] = ${contents};
`;
}

function throwTopLangsUnavailable(message) {
  throw Object.assign(new Error(message), {
    name: 'TopLangsUnavailableError',
  });
}

await runScript(() =>
  withGithubSync(outputPath, async ({ offlineMode }) => {
    if (offlineMode) {
      throw Object.assign(new Error('Offline mode: skipping top-langs fetch'), {
        name: 'GitHubOfflineMode',
      });
    }

    const url = await readTopLangsUrl();
    const response = await fetch(url, {
      headers: { Accept: 'image/svg+xml,text/plain,*/*' },
    });
    if (!response.ok) {
      throwTopLangsUnavailable(
        `top-langs fetch failed (${response.status}) for ${url}`
      );
    }

    const svg = await response.text();
    const names = parseLangNamesFromSvg(svg);
    if (names.length === 0) {
      throwTopLangsUnavailable('top-langs SVG contained no language names');
    }

    const svgColors = parseLangColorsFromSvg(svg);
    const languages = names.map((name) => ({
      name,
      color: svgColors.get(name) ?? LANGUAGE_COLORS[name] ?? 'var(--accent)',
    }));

    await writeFile(outputPath, renderOutput(languages));
  })
);
