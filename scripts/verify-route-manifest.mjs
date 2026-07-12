#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const schemaPath = path.join(repoRoot, 'schema/route-manifest.schema.json');
const manifestPath = path.join(repoRoot, 'src/data/route-manifest.json');

const OWNER_REPO_PATTERN = /^[^/]+\/[^/]+$/;
const HTTPS_PATTERN = /^https:\/\//;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateEntry(entry, index) {
  assert(
    entry && typeof entry === 'object',
    `entry ${index} must be an object`
  );
  assert(
    typeof entry.pathPrefix === 'string' && entry.pathPrefix.startsWith('/'),
    `entry ${index}: pathPrefix must start with /`
  );
  assert(
    typeof entry.backend === 'string' && HTTPS_PATTERN.test(entry.backend),
    `entry ${index}: backend must be https URL`
  );
  assert(
    typeof entry.stripPrefix === 'string',
    `entry ${index}: stripPrefix required`
  );
  assert(
    typeof entry.ownerRepo === 'string' &&
      OWNER_REPO_PATTERN.test(entry.ownerRepo),
    `entry ${index}: ownerRepo must be owner/repo`
  );
  assert(
    entry.kind === 'site' || entry.kind === 'page',
    `entry ${index}: kind must be site or page`
  );
  if (entry.previewUrl !== undefined) {
    assert(
      typeof entry.previewUrl === 'string' &&
        HTTPS_PATTERN.test(entry.previewUrl),
      `entry ${index}: previewUrl must be https URL`
    );
  }
}

async function main() {
  await readFile(schemaPath, 'utf8');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert(Array.isArray(manifest), 'route-manifest must be a JSON array');
  assert(manifest.length > 0, 'route-manifest must have at least one route');

  const prefixes = new Set();
  for (let i = 0; i < manifest.length; i++) {
    validateEntry(manifest[i], i);
    assert(
      !prefixes.has(manifest[i].pathPrefix),
      `duplicate pathPrefix ${manifest[i].pathPrefix}`
    );
    prefixes.add(manifest[i].pathPrefix);
  }

  assert(prefixes.has('/'), 'route-manifest must include a / route');

  console.log('✓ verify-route-manifest passed');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
