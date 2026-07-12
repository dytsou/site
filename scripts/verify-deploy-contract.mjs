#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  assert,
  isHttpsUrl,
  isOwnerRepo,
  isSlashPath,
  resolveSafeRepoPath,
  runVerifier,
} from './lib/verify-helpers.mjs';

const repoRoot = process.cwd();
const outputDirArg = process.argv[3] ?? process.env.OUTPUT_DIR;

function validateContract(contract) {
  assert(
    contract && typeof contract === 'object',
    'contract must be an object'
  );
  assert(isOwnerRepo(contract.ownerRepo), 'ownerRepo must be owner/repo');
  assert(
    isSlashPath(contract.canonicalPath),
    'canonicalPath must start with /'
  );
  assert(isHttpsUrl(contract.canonicalUrl), 'canonicalUrl must be https URL');
  assert(
    typeof contract.pagesProject === 'string' &&
      contract.pagesProject.length > 0,
    'pagesProject required'
  );
  assert(
    typeof contract.outputDir === 'string' && contract.outputDir.length > 0,
    'outputDir required'
  );
  assert(isSlashPath(contract.basePath), 'basePath must start with /');
  if (contract.previewUrl !== undefined) {
    assert(isHttpsUrl(contract.previewUrl), 'previewUrl must be https URL');
  }
}

async function assertSafeOutputDir(outputDir, contractOutputDir) {
  assert(
    outputDir === contractOutputDir,
    'output-dir must match contract outputDir'
  );
  const resolved = resolveSafeRepoPath(repoRoot, outputDir);

  try {
    await access(resolved);
  } catch {
    throw new Error('output-dir does not exist');
  }

  await access(path.join(resolved, 'index.html'));
}

async function main() {
  const contractRel = process.argv[2] ?? 'deploy-contract.json';
  const contractPath = resolveSafeRepoPath(repoRoot, contractRel);

  await readFile(
    resolveSafeRepoPath(repoRoot, 'schema/deploy-contract.schema.json'),
    'utf8'
  );
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  validateContract(contract);

  if (outputDirArg) {
    await assertSafeOutputDir(outputDirArg, contract.outputDir);
  }

  console.log('✓ verify-deploy-contract passed');
}

await runVerifier('verify-deploy-contract', main);
