#!/usr/bin/env node
/**
 * Point dy.tsou.me at the Cloudflare Pages project.
 * Requires CLOUDFLARE_API_TOKEN with DNS edit permission.
 */
import process from 'node:process';

const ZONE_ID_RE = /^[a-f0-9]{32}$/i;
const RECORD_ID_RE = /^[a-f0-9]{32}$/i;
const HOSTNAME_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const PAGES_TARGET_RE = /^[a-z0-9-]+\.pages\.dev$/i;

function assertZoneId(zoneId) {
  if (!ZONE_ID_RE.test(zoneId)) {
    throw new Error('Invalid CLOUDFLARE_ZONE_ID');
  }
  return zoneId;
}

function assertRecordId(recordId) {
  if (!RECORD_ID_RE.test(recordId)) {
    throw new Error('Invalid DNS record id');
  }
  return recordId;
}

function assertHostname(hostname) {
  if (!HOSTNAME_RE.test(hostname)) {
    throw new Error('Invalid CUSTOM_DOMAIN');
  }
  return hostname;
}

function assertPagesTarget(pagesTarget) {
  if (!PAGES_TARGET_RE.test(pagesTarget)) {
    throw new Error('Invalid PAGES_CNAME_TARGET');
  }
  return pagesTarget;
}

function zoneApiUrl(zoneId, path = '') {
  const safeZoneId = assertZoneId(zoneId);
  return new URL(
    `/client/v4/zones/${safeZoneId}${path}`,
    'https://api.cloudflare.com'
  );
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const hostname = assertHostname(process.env.CUSTOM_DOMAIN ?? 'dy.tsou.me');
const pagesTarget = assertPagesTarget(
  process.env.PAGES_CNAME_TARGET ?? 'dy-tsou-me.pages.dev'
);

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

const listUrl = zoneApiUrl(zoneId, '/dns_records');
listUrl.searchParams.set('name', hostname);

const listRes = await fetch(listUrl, { headers });
const listData = await listRes.json();
if (!listData.success) {
  throw new Error('Failed to list DNS records');
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
    console.log('✓ DNS record already points to Cloudflare Pages');
    process.exit(0);
  }

  const updateUrl = zoneApiUrl(
    zoneId,
    `/dns_records/${assertRecordId(existing.id)}`
  );
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  const updateData = await updateRes.json();
  if (!updateData.success) {
    throw new Error('Failed to update DNS record');
  }
  console.log('✓ DNS record updated for Cloudflare Pages');
  process.exit(0);
}

const createUrl = zoneApiUrl(zoneId, '/dns_records');
const createRes = await fetch(createUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});
const createData = await createRes.json();
if (!createData.success) {
  throw new Error('Failed to create DNS record');
}

console.log('✓ DNS record created for Cloudflare Pages');
