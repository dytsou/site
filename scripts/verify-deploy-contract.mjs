#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const contractPath = path.join(
  repoRoot,
  process.argv[2] ?? 'deploy-contract.json'
);
const outputDirArg = process.argv[3] ?? process.env.OUTPUT_DIR;

const OWNER_REPO_PATTERN = /^[^/]+\/[^/]+$/;
const HTTPS_PATTERN = /^https:\/\//;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateContract(contract) {
  assert(
    contract && typeof contract === 'object',
    'contract must be an object'
  );
  assert(
    typeof contract.ownerRepo === 'string' &&
      OWNER_REPO_PATTERN.test(contract.ownerRepo),
    'ownerRepo must be owner/repo'
  );
  assert(
    typeof contract.canonicalPath === 'string' &&
      contract.canonicalPath.startsWith('/'),
    'canonicalPath must start with /'
  );
  assert(
    typeof contract.canonicalUrl === 'string' &&
      HTTPS_PATTERN.test(contract.canonicalUrl),
    'canonicalUrl must be https URL'
  );
  assert(
    typeof contract.pagesProject === 'string' &&
      contract.pagesProject.length > 0,
    'pagesProject required'
  );
  assert(
    typeof contract.outputDir === 'string' && contract.outputDir.length > 0,
    'outputDir required'
  );
  assert(
    typeof contract.basePath === 'string' && contract.basePath.startsWith('/'),
    'basePath must start with /'
  );
  if (contract.previewUrl !== undefined) {
    assert(
      typeof contract.previewUrl === 'string' &&
        HTTPS_PATTERN.test(contract.previewUrl),
      'previewUrl must be https URL'
    );
  }
}

async function assertSafeOutputDir(outputDir, contractOutputDir) {
  assert(
    outputDir === contractOutputDir,
    `output-dir "${outputDir}" must match contract outputDir "${contractOutputDir}"`
  );
  assert(!path.isAbsolute(outputDir), 'output-dir must be relative');
  assert(!outputDir.includes('..'), 'output-dir must not contain ..');
  const resolved = path.resolve(repoRoot, outputDir);
  assert(
    resolved.startsWith(repoRoot + path.sep),
    'output-dir must stay inside workspace'
  );

  try {
    await access(resolved);
  } catch {
    throw new Error(`output-dir "${outputDir}" does not exist`);
  }

  await access(path.join(resolved, 'index.html'));
}

async function main() {
  await readFile(
    path.join(repoRoot, 'schema/deploy-contract.schema.json'),
    'utf8'
  );
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  validateContract(contract);

  if (outputDirArg) {
    await assertSafeOutputDir(outputDirArg, contract.outputDir);
  }

  console.log('✓ verify-deploy-contract passed');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
