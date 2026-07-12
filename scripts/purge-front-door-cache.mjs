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
  return [...urls].sort((a, b) => a.localeCompare(b));
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

// Purge is belt-and-suspenders on top of HTML `no-store`: the edge already
// revalidates page HTML every request, so a missing/underscoped token or a
// transient API error should warn (::warning:: for GitHub Actions) but never
// fail an otherwise-successful deploy. The token needs Zone → Cache Purge.
// ponytail: best-effort by design; run with the correct token to hard-verify.
/** @param {'missing-secrets' | 'request-failed' | 'api-rejected'} reason */
function warn(reason) {
  const messages = {
    'missing-secrets':
      'CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN unset; skipped purge',
    'request-failed': 'purge request failed; skipped purge',
    'api-rejected':
      'API rejected purge (token needs Zone → Cache Purge); skipped purge',
  };
  console.log(`::warning::purge-front-door-cache: ${messages[reason]}`);
  process.exit(0);
}

if (!zoneId || !token) {
  warn('missing-secrets');
}

let data;
try {
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
  data = await res.json();
} catch {
  warn('request-failed');
}

if (!data.success) {
  warn('api-rejected');
}
console.log(`purge-front-door-cache: purged ${files.length} URL(s)`);
