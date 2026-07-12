#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * @param {Array<{ pathPrefix: string }>} manifest
 * @param {string} origin
 */
export function purgeUrlsFromManifest(manifest, origin) {
  const base = origin.replace(/\/$/, '');
  const urls = new Set([`${base}/`, base]);
  for (const route of manifest) {
    const { pathPrefix } = route;
    if (pathPrefix === '/' || !pathPrefix.endsWith('/')) continue;
    urls.add(`${base}${pathPrefix}`);
    urls.add(`${base}${pathPrefix.slice(0, -1)}`);
  }
  return [...urls].sort();
}

async function selfCheck() {
  const urls = purgeUrlsFromManifest(
    [{ pathPrefix: '/resume/' }, { pathPrefix: '/cal/' }, { pathPrefix: '/' }],
    'https://dy.tsou.me'
  );
  assert.deepEqual(urls, [
    'https://dy.tsou.me',
    'https://dy.tsou.me/',
    'https://dy.tsou.me/cal',
    'https://dy.tsou.me/cal/',
    'https://dy.tsou.me/resume',
    'https://dy.tsou.me/resume/',
  ]);
  console.log('purge-front-door-cache: self-check ok');
}

if (process.argv.includes('--self-check')) {
  await selfCheck();
  process.exit(0);
}

const zoneId = process.env.CLOUDFLARE_ZONE_ID?.replace(/\s/g, '');
const token = process.env.CLOUDFLARE_API_TOKEN?.replace(/\s/g, '');
const origin = process.env.SITE_URL || 'https://dy.tsou.me';
const dryRun = process.argv.includes('--dry-run');

const manifest = JSON.parse(
  await readFile('src/data/route-manifest.json', 'utf8')
);
const files = purgeUrlsFromManifest(manifest, origin);

if (dryRun) {
  console.log('purge-front-door-cache: dry-run', files.join(', '));
  process.exit(0);
}

assert(zoneId, 'CLOUDFLARE_ZONE_ID is required');
assert(token, 'CLOUDFLARE_API_TOKEN is required');

const res = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  }
);
const data = await res.json();
assert(data.success, `purge failed: ${JSON.stringify(data.errors ?? data)}`);
console.log(`purge-front-door-cache: purged ${files.length} URL(s)`);
