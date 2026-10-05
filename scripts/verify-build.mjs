import { readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { isPrivateHeatmapPath } from '../shared/heatmap-private.js';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');
const routesPath = path.join(repoRoot, 'src/data/site-routes.json');

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]+/,
  /GITHUB_TOKEN/,
  /CLOUDFLARE_API_TOKEN/,
  /Bearer /,
];

function readDist(relativePath) {
  return readFile(path.join(distDir, relativePath), 'utf8');
}

async function listDistFiles(dir = distDir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const filesByEntry = await Promise.all(
    entries.map((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      return Promise.resolve(
        entry.isDirectory()
          ? listDistFiles(path.join(dir, entry.name), relative)
          : [relative]
      );
    })
  );
  return filesByEntry.flat();
}

async function assertExists(relativePath) {
  try {
    await readDist(relativePath);
  } catch {
    throw new Error(`Missing dist/${relativePath}`);
  }
}

function routeToHtmlPath(routePath) {
  if (routePath === '/') return 'index.html';
  return `${routePath.slice(1)}/index.html`;
}

async function assertAllRoutesExist(routes) {
  await Promise.all(
    routes.map((route) => assertExists(routeToHtmlPath(route.path)))
  );
}

async function assertRequiredArtifacts() {
  const requiredArtifacts = [
    'sitemap.xml',
    'robots.txt',
    '_headers',
    'auth.md',
    '.well-known/api-catalog',
    '.well-known/oauth-authorization-server',
    '.well-known/oauth-protected-resource',
    '.well-known/jwks.json',
    '.well-known/mcp/server-card.json',
    '.well-known/agent-skills/index.json',
    '.well-known/agent-skills/portfolio-webmcp/SKILL.md',
  ];

  await Promise.all(requiredArtifacts.map(assertExists));

  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/verify-agent-discovery.mjs', '--local'],
      { cwd: repoRoot, stdio: 'inherit' }
    );
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error('agent discovery verify failed'))
    );
  });
}

async function assertRouteTitlesAndScripts(routes) {
  const pages = await Promise.all(
    routes.map((route) => readDist(routeToHtmlPath(route.path)))
  );
  const titles = new Set();
  for (const [index, html] of pages.entries()) {
    const route = routes[index];
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) {
      throw new Error(`No <title> in ${route.path}`);
    }
    const title = titleMatch[1];
    if (titles.has(title)) {
      throw new Error(`Duplicate <title> across routes: ${title}`);
    }
    titles.add(title);
  }
}

async function assertNoSecretPatterns() {
  const files = await listDistFiles();
  await Promise.all(
    files.map(async (file) => {
      const content = await readDist(file);
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          throw new Error(`Secret pattern ${pattern} found in dist/${file}`);
        }
      }
    })
  );
}

function quotedAttributes(html) {
  return [
    ...html.matchAll(/(?:^|\s)([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g),
  ].map((match) => [match[1].toLowerCase(), match[2] ?? match[3]]);
}

function assertPrivateNoindex(html) {
  const noindex = (html.match(/<meta\b[^>]*>/gi) ?? []).some((meta) => {
    const attrs = Object.fromEntries(quotedAttributes(meta));
    return (
      attrs.name?.toLowerCase() === 'robots' &&
      attrs.content
        ?.toLowerCase()
        .split(/[\s,]+/)
        .includes('noindex')
    );
  });
  if (!noindex) throw new Error('Private heatmap artifact must be noindex');
}

function assertPublicHtmlLinks(content, file) {
  for (const [name, value] of quotedAttributes(content)) {
    if (name !== 'href') continue;
    let link;
    try {
      link = new URL(value, 'https://dy.tsou.me');
    } catch {
      continue;
    }
    if (isPrivateHeatmapPath(link.pathname))
      throw new Error(`Private path advertised in public HTML: ${file}`);
  }
}

async function verifyHeatmapArtifact(outputDir, file, secrets) {
  if (
    !/\.(?:html|js|mjs|css|json|txt|md|xml)$/.test(file) &&
    !file.startsWith('.well-known/')
  )
    return;
  const content = await readFile(path.join(outputDir, file), 'utf8');
  if (secrets.some((value) => content.includes(value)))
    throw new Error(`Secret configuration found in dist/${file}`);
  if (file.endsWith('.html')) {
    if (!file.startsWith('insights/')) assertPublicHtmlLinks(content, file);
    return;
  }
  if (
    !file.startsWith('_astro/') &&
    /(?:^|[/:])(?:api\/)?insights(?:[/?#"'\s<]|$)/i.test(content)
  )
    throw new Error(`Private path advertised in public discovery: ${file}`);
}

/** Private assets must be guarded at runtime; this check prevents accidental public discovery or secret bundling. */
export async function verifyHeatmapBuild({
  outputDir = distDir,
  routes,
  env = process.env,
}) {
  let html;
  try {
    html = await readFile(path.join(outputDir, 'insights/index.html'), 'utf8');
  } catch {
    throw new Error('Missing private heatmap artifact');
  }
  assertPrivateNoindex(html);
  if (routes.some((route) => isPrivateHeatmapPath(route.path)))
    throw new Error('Private heatmap path in public route manifest');
  const secretNames = [
    'HEATMAP_READ_TOKEN',
    'HEATMAP_WEB_ANALYTICS_TOKEN',
    'HEATMAP_ACCESS_ISSUER',
    'HEATMAP_ACCESS_AUD',
    'HEATMAP_OWNER_EMAILS',
    'HEATMAP_ACCOUNT_ID',
  ];
  const secretValues = secretNames
    .map((name) => env[name])
    .filter((value) => typeof value === 'string' && value.length > 0);
  const files = await listDistFiles(outputDir);
  await Promise.all(
    files.map((file) =>
      verifyHeatmapArtifact(outputDir, file, [...secretNames, ...secretValues])
    )
  );
}

async function main() {
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));

  await assertAllRoutesExist(routes);
  await assertRequiredArtifacts();
  await assertRouteTitlesAndScripts(routes);

  const projectsHtml = await readDist('projects/index.html');
  if (!projectsHtml.includes('carousel-container')) {
    throw new Error('Projects page missing carousel markup');
  }

  await assertNoSecretPatterns();
  await verifyHeatmapBuild({ routes });

  console.log('✓ verify-build passed');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
