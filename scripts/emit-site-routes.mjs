import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const routesPath = path.join(repoRoot, 'src/data/site-routes.json');

function validateRoute(route, index) {
  if (!route || typeof route !== 'object') {
    throw new Error(`site-routes[${index}] must be an object`);
  }
  if (typeof route.path !== 'string' || !route.path.startsWith('/')) {
    throw new Error(`site-routes[${index}].path must start with /`);
  }
  if (typeof route.changefreq !== 'string' || !route.changefreq) {
    throw new Error(`site-routes[${index}].changefreq must be a string`);
  }
  if (typeof route.priority !== 'string' || !route.priority) {
    throw new Error(`site-routes[${index}].priority must be a string`);
  }
}

async function main() {
  const raw = await readFile(routesPath, 'utf8');
  const routes = JSON.parse(raw);
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error('site-routes.json must be a non-empty array');
  }
  routes.forEach((route, index) => validateRoute(route, index));
  const canonical = `${JSON.stringify(routes, null, 2)}\n`;
  await writeFile(routesPath, canonical);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
