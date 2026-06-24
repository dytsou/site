import { readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');
const routesPath = path.join(repoRoot, 'src/data/site-routes.json');

const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9]+/,
  /GITHUB_TOKEN/,
  /CLOUDFLARE_API_TOKEN/,
  /Bearer /,
];

async function readDist(relativePath) {
  return readFile(path.join(distDir, relativePath), 'utf8');
}

async function listDistFiles(dir = distDir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(
        ...(await listDistFiles(path.join(dir, entry.name), relative))
      );
    } else {
      files.push(relative);
    }
  }
  return files;
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
  for (const route of routes) {
    await assertExists(routeToHtmlPath(route.path));
  }
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

  for (const artifact of requiredArtifacts) {
    await assertExists(artifact);
  }

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
  const titles = new Set();
  for (const route of routes) {
    const html = await readDist(routeToHtmlPath(route.path));
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
  for (const file of files) {
    const content = await readDist(file);
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error(`Secret pattern ${pattern} found in dist/${file}`);
      }
    }
  }
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

  console.log('✓ verify-build passed');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
