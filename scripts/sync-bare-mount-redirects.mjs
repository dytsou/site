#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const MANAGED_REF_PREFIX = 'subpath-deploy-bare-';

/**
 * Cloudflare zone and ruleset IDs are 32-char lowercase hex. Validate before
 * interpolating into an API URL path so an unexpected/tainted API response
 * cannot redirect the request elsewhere (SSRF guard).
 * @param {unknown} id
 * @returns {boolean}
 */
export function isCloudflareId(id) {
  return typeof id === 'string' && /^[0-9a-f]{32}$/.test(id);
}

/**
 * @param {Array<{ pathPrefix: string }>} manifest
 * @param {string} origin
 */
export function bareMountRedirectRules(manifest, origin) {
  const { origin: siteOrigin, hostname } = new URL(origin);
  const rules = [];
  for (const route of manifest) {
    const { pathPrefix } = route;
    if (pathPrefix === '/' || !pathPrefix.endsWith('/')) continue;
    const bare = pathPrefix.slice(0, -1);
    const slug = bare.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
    rules.push({
      ref: `${MANAGED_REF_PREFIX}${slug}`,
      expression: `(http.host eq "${hostname}" and http.request.uri.path eq "${bare}")`,
      description: `Front door: ${bare} → ${pathPrefix}`,
      action: 'redirect',
      enabled: true,
      action_parameters: {
        from_value: {
          target_url: { value: `${siteOrigin}${pathPrefix}` },
          status_code: 308,
          preserve_query_string: true,
        },
      },
    });
  }
  return rules;
}

/**
 * @param {Array<{ ref?: string }>} existing
 * @param {Array<{ ref: string }>} managed
 */
export function mergeManagedRedirectRules(existing, managed) {
  const managedRefs = new Set(managed.map((rule) => rule.ref));
  const kept = existing.filter(
    (rule) =>
      !rule.ref?.startsWith(MANAGED_REF_PREFIX) || managedRefs.has(rule.ref)
  );
  const byRef = new Map(kept.map((rule) => [rule.ref, rule]));
  for (const rule of managed) {
    byRef.set(rule.ref, rule);
  }
  return [...byRef.values()];
}

async function selfCheck() {
  const rules = bareMountRedirectRules(
    [{ pathPrefix: '/resume/' }, { pathPrefix: '/cal/' }, { pathPrefix: '/' }],
    'https://dy.tsou.me'
  );
  assert.equal(rules.length, 2);
  assert.equal(rules[0].ref, 'subpath-deploy-bare-resume');
  assert.match(rules[0].expression, /eq "\/resume"/);
  assert.equal(
    rules[0].action_parameters.from_value.target_url.value,
    'https://dy.tsou.me/resume/'
  );
  const merged = mergeManagedRedirectRules(
    [
      { ref: 'subpath-deploy-bare-resume', expression: 'old' },
      { ref: 'user-rule', expression: 'x' },
    ],
    rules
  );
  assert.equal(merged.length, 3);
  assert.equal(merged.find((r) => r.ref === 'user-rule')?.expression, 'x');
  assert.equal(isCloudflareId('a'.repeat(32)), true);
  assert.equal(isCloudflareId('A'.repeat(32)), false);
  assert.equal(isCloudflareId('../evil'), false);
  assert.equal(isCloudflareId(undefined), false);
  console.log('sync-bare-mount-redirects: self-check ok');
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
const managed = bareMountRedirectRules(manifest, origin);

if (dryRun) {
  console.log(
    'sync-bare-mount-redirects: dry-run',
    managed.map((rule) => rule.ref).join(', ')
  );
  process.exit(0);
}

/** @param {'missing-secrets' | 'request-failed' | 'api-rejected'} reason */
function warn(reason) {
  const messages = {
    'missing-secrets':
      'CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN unset; skipped bare-mount redirects',
    'request-failed': 'bare-mount redirect sync request failed; skipped',
    'api-rejected':
      'API rejected bare-mount redirect sync (token needs Dynamic URL Redirects Write); skipped',
  };
  console.log(`::warning::sync-bare-mount-redirects: ${messages[reason]}`);
  process.exit(0);
}

if (!zoneId || !token) {
  warn('missing-secrets');
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

let entrypoint;
try {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
    { headers }
  );
  const data = await res.json();
  if (!data.success) {
    warn('api-rejected');
  }
  entrypoint = data.result;
} catch {
  warn('request-failed');
}

const rules = mergeManagedRedirectRules(entrypoint?.rules ?? [], managed);
const body = {
  name: entrypoint?.name ?? 'Redirect rules ruleset',
  kind: 'zone',
  phase: 'http_request_dynamic_redirect',
  rules,
};

if (!isCloudflareId(zoneId)) {
  warn('api-rejected');
}
const existingRulesetId = isCloudflareId(entrypoint?.id) ? entrypoint.id : null;

let data;
try {
  const url = existingRulesetId
    ? `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/${existingRulesetId}`
    : `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets`;
  const res = await fetch(url, {
    method: existingRulesetId ? 'PUT' : 'POST',
    headers,
    body: JSON.stringify(body),
  });
  data = await res.json();
} catch {
  warn('request-failed');
}

if (!data.success) {
  warn('api-rejected');
}

console.log(
  `sync-bare-mount-redirects: synced ${managed.length} bare-mount redirect(s)`
);
