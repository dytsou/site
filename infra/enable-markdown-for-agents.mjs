#!/usr/bin/env node
/**
 * Enable Cloudflare zone Markdown for Agents (content_converter).
 * Requires Pro+ on the zone; Free plans use functions/_middleware.js instead.
 */
import process from 'node:process';

const ZONE_ID_RE = /^[a-f0-9]{32}$/i;

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;

if (!token || !zoneId) {
  console.log(
    'Skip: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to enable zone conversion'
  );
  process.exit(0);
}

if (!ZONE_ID_RE.test(zoneId)) {
  console.log('Skip: invalid CLOUDFLARE_ZONE_ID');
  process.exit(0);
}

const res = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/content_converter`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: 'on' }),
  }
);

const data = await res.json();
if (!data.success) {
  // ponytail: optional Pro+ setting; Pages middleware handles markdown on Free
  console.log(
    'Skip: zone content_converter unavailable (Pro+ plan and Zone Settings permission required)'
  );
  process.exit(0);
}

console.log('✓ zone content_converter enabled');
