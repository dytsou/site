#!/usr/bin/env node
import assert from 'node:assert/strict';

// Purge is belt-and-suspenders on top of HTML `no-store`: the edge already
// revalidates page HTML every request. The one job left for purge is clearing
// entries cached *before* no-store/redirect shipped (e.g. a stale 200 pinned
// on bare /resume that the edge serves without ever invoking the Worker).
//
// Purge Everything is the only path-agnostic purge available on non-Enterprise
// plans (purge by hostname/prefix/tag is Enterprise-only), and it reliably
// evicts those poisoned entries. Hashed assets simply repopulate on demand.
// ponytail: best-effort by design — run with a Zone → Cache Purge token to
// hard-verify; a missing/underscoped token warns but never fails the deploy.

/** @param {string} zoneId */
export function purgeCacheUrl(zoneId) {
  return `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
}

async function selfCheck() {
  assert.equal(
    purgeCacheUrl('abc123'),
    'https://api.cloudflare.com/client/v4/zones/abc123/purge_cache'
  );
  console.log('purge-front-door-cache: self-check ok');
}

if (process.argv.includes('--self-check')) {
  await selfCheck();
  process.exit(0);
}

const zoneId = process.env.CLOUDFLARE_ZONE_ID?.replace(/\s/g, '');
const token = process.env.CLOUDFLARE_API_TOKEN?.replace(/\s/g, '');
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('purge-front-door-cache: dry-run purge_everything');
  process.exit(0);
}

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
  const res = await fetch(purgeCacheUrl(zoneId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  });
  data = await res.json();
} catch {
  warn('request-failed');
}

if (!data.success) {
  warn('api-rejected');
}
console.log('purge-front-door-cache: purged everything');
