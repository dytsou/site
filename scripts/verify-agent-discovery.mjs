#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');

const ENDPOINTS = [
  {
    path: '/.well-known/oauth-authorization-server',
    required: [
      'issuer',
      'authorization_endpoint',
      'token_endpoint',
      'jwks_uri',
      'grant_types_supported',
    ],
    nested: { agent_auth: ['register_uri'] },
  },
  {
    path: '/.well-known/oauth-protected-resource',
    required: ['resource', 'authorization_servers', 'scopes_supported'],
  },
  {
    path: '/.well-known/mcp/server-card.json',
    required: ['serverInfo'],
    nested: { serverInfo: ['name', 'version'] },
  },
  {
    path: '/.well-known/agent-skills/index.json',
    required: ['$schema', 'skills'],
  },
];

const siteUrls = [
  process.env.SITE_URL,
  process.env.PAGES_URL,
  'https://dy.tsou.me',
  'https://dy-tsou-me.pages.dev',
].filter(Boolean);

function assertKeys(value, keys, label) {
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`${label} missing ${key}`);
    }
  }
}

function validateDocument(endpoint, doc) {
  assertKeys(doc, endpoint.required, endpoint.path);
  for (const [key, keys] of Object.entries(endpoint.nested ?? {})) {
    if (typeof doc[key] !== 'object' || doc[key] === null) {
      throw new Error(`${endpoint.path} missing ${key}`);
    }
    assertKeys(doc[key], keys, `${endpoint.path}.${key}`);
  }

  if (endpoint.path.endsWith('agent-skills/index.json')) {
    if (!Array.isArray(doc.skills) || doc.skills.length === 0) {
      throw new Error('agent-skills index has no skills');
    }
    for (const skill of doc.skills) {
      assertKeys(
        skill,
        ['name', 'type', 'description', 'url', 'digest'],
        'skills[]'
      );
      if (!skill.digest.startsWith('sha256:')) {
        throw new Error(`skills[${skill.name}] digest must be sha256:{hex}`);
      }
    }
  }
}

async function verifyLocal() {
  for (const endpoint of ENDPOINTS) {
    const relative = endpoint.path.replace(/^\//, '');
    const body = await readFile(path.join(distDir, relative), 'utf8');
    if (body.trimStart().startsWith('<!DOCTYPE')) {
      throw new Error(`dist/${relative} is HTML, expected JSON`);
    }
    validateDocument(endpoint, JSON.parse(body));
  }
}

async function verifyRemote(baseUrl) {
  const origin = new URL(baseUrl).origin;

  for (const endpoint of ENDPOINTS) {
    const res = await fetch(`${origin}${endpoint.path}`);
    const contentType = res.headers.get('content-type') ?? '';
    const body = await res.text();

    if (!res.ok) {
      throw new Error(`${endpoint.path} returned ${res.status}`);
    }
    if (body.trimStart().startsWith('<!DOCTYPE')) {
      throw new Error(`${endpoint.path} returned HTML instead of JSON`);
    }
    if (!contentType.includes('application/json')) {
      throw new Error(
        `${endpoint.path} expected application/json, got ${contentType || '(none)'}`
      );
    }

    validateDocument(endpoint, JSON.parse(body));
  }

  const authRes = await fetch(`${origin}/auth.md`);
  const authType = authRes.headers.get('content-type') ?? '';
  const authBody = await authRes.text();
  if (!authRes.ok) {
    throw new Error(`/auth.md returned ${authRes.status}`);
  }
  if (!authType.includes('text/markdown')) {
    throw new Error(
      `/auth.md expected text/markdown, got ${authType || '(none)'}`
    );
  }
  if (!authBody.includes('Protected Resource Metadata')) {
    throw new Error('/auth.md missing discovery section');
  }
}

async function main() {
  if (process.argv.includes('--local')) {
    await verifyLocal();
    console.log('✓ agent discovery artifacts OK (dist)');
    return;
  }

  let lastError;
  for (const siteUrl of new Set(siteUrls)) {
    try {
      await verifyRemote(siteUrl);
      console.log(`✓ agent discovery OK (${new URL(siteUrl).origin})`);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No site URLs configured for agent discovery');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
