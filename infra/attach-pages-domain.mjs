#!/usr/bin/env node
/** Attach dy.tsou.me to the Cloudflare Pages project (idempotent). */
import process from 'node:process';

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT_NAME ?? 'dy-tsou-me';
const domain = process.env.CUSTOM_DOMAIN ?? 'dy.tsou.me';

if (!token || !accountId) {
  console.log(
    'Skip: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID to attach the custom domain'
  );
  process.exit(0);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`;

const listRes = await fetch(base, {
  headers: { Authorization: `Bearer ${token}` },
});
const listData = await listRes.json();
if (!listData.success) {
  throw new Error(
    listData.errors?.map((e) => e.message).join('; ') ??
      'Failed to list domains'
  );
}

if (listData.result?.some((entry) => entry.name === domain)) {
  console.log('✓ custom domain already attached to Pages project');
  process.exit(0);
}

const createRes = await fetch(base, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: domain }),
});
const createData = await createRes.json();
if (!createData.success) {
  throw new Error(
    createData.errors?.map((e) => e.message).join('; ') ??
      'Failed to attach domain'
  );
}

console.log('✓ custom domain attached to Pages project');
