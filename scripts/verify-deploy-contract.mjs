#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
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

async function assertOutputDirExists(contractOutputDir) {
  const safeOutputDir = toSafeRepoPath(repoRoot, contractOutputDir);

  try {
    await access(safeOutputDir);
  } catch {
    throw new Error('output-dir does not exist');
  }

  await access(path.join(safeOutputDir, 'index.html'));
}

async function main() {
  const contractRel = process.argv[2] ?? 'deploy-contract.json';
  const contractPath = toSafeRepoPath(repoRoot, contractRel);

  await readFile(
    toSafeRepoPath(repoRoot, 'schema/deploy-contract.schema.json'),
    'utf8'
  );
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  validateContract(contract);

  if (outputDirArg) {
    assert(
      outputDirArg === contract.outputDir,
      'output-dir must match contract outputDir'
    );
    await assertOutputDirExists(contract.outputDir);
  }

  console.log('✓ verify-deploy-contract passed');
}

await runVerifier('verify-deploy-contract', main);
