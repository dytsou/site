#!/usr/bin/env node
/**
 * Point dy.tsou.me at the Cloudflare Pages project.
 * Requires CLOUDFLARE_API_TOKEN with DNS edit permission.
 */
import process from 'node:process';

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const hostname = process.env.CUSTOM_DOMAIN ?? 'dy.tsou.me';
const pagesTarget = process.env.PAGES_CNAME_TARGET ?? 'dy-tsou-me.pages.dev';

if (!token || !zoneId) {
  console.log(
    'Skip: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to update DNS'
  );
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const listRes = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${hostname}`,
  { headers }
);
const listData = await listRes.json();
if (!listData.success) {
  throw new Error(
    listData.errors?.map((e) => e.message).join('; ') ??
      'Failed to list DNS records'
  );
}

const existing = listData.result?.[0];
const body = {
  type: 'CNAME',
  name: hostname,
  content: pagesTarget,
  proxied: true,
};

if (existing) {
  if (existing.type === 'CNAME' && existing.content === pagesTarget) {
    console.log(`✓ ${hostname} already points to ${pagesTarget}`);
    process.exit(0);
  }

  const updateRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    }
  );
  const updateData = await updateRes.json();
  if (!updateData.success) {
    throw new Error(
      updateData.errors?.map((e) => e.message).join('; ') ??
        'Failed to update DNS record'
    );
  }
  console.log(`✓ updated ${hostname} -> ${pagesTarget}`);
  process.exit(0);
}

const createRes = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }
);
const createData = await createRes.json();
if (!createData.success) {
  throw new Error(
    createData.errors?.map((e) => e.message).join('; ') ??
      'Failed to create DNS record'
  );
}

console.log(`✓ created ${hostname} -> ${pagesTarget}`);
