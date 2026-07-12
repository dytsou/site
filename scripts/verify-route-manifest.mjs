#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import {
  assert,
  isHttpsUrl,
  isOwnerRepo,
  isSlashPath,
  toSafeRepoPath,
  runVerifier,
} from './lib/verify-helpers.mjs';

const repoRoot = process.cwd();

function validateEntry(entry, index) {
  assert(
    entry && typeof entry === 'object',
    `entry ${index} must be an object`
  );
  assert(
    isSlashPath(entry.pathPrefix),
    `entry ${index}: pathPrefix must start with /`
  );
  assert(
    isHttpsUrl(entry.backend),
    `entry ${index}: backend must be https URL`
  );
  assert(
    typeof entry.stripPrefix === 'string',
    `entry ${index}: stripPrefix required`
  );
  assert(
    isOwnerRepo(entry.ownerRepo),
    `entry ${index}: ownerRepo must be owner/repo`
  );
  assert(
    entry.kind === 'site' || entry.kind === 'page',
    `entry ${index}: kind must be site or page`
  );
  if (entry.previewUrl !== undefined) {
    assert(
      isHttpsUrl(entry.previewUrl),
      `entry ${index}: previewUrl must be https URL`
    );
  }
}

async function main() {
  const schemaPath = toSafeRepoPath(
    repoRoot,
    'schema/route-manifest.schema.json'
  );
  const manifestPath = toSafeRepoPath(repoRoot, 'src/data/route-manifest.json');

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

await runVerifier('verify-route-manifest', main);
