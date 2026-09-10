import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'generate-favicon-pngs.mjs');
const trackedOutputDir = path.join(repoRoot, 'public', 'assets', 'favicons');
const primaryOutputPath = path.join(
  repoRoot,
  'public',
  'assets',
  'favicon.png'
);

async function listPngs(directory) {
  return (await readdir(directory))
    .filter((file) => file.endsWith('.png'))
    .sort();
}

async function runGenerator(...args) {
  return execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
  });
}

async function withTempOutput(callback) {
  const outputDir = await mkdtemp(
    path.join(os.tmpdir(), 'favicon-generation-')
  );
  try {
    return await callback(outputDir);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}

test('default generation matches the tracked favicon set and dimensions', async () => {
  await withTempOutput(async (outputDir) => {
    await runGenerator('--output-dir', outputDir);

    const [generatedFiles, trackedFiles] = await Promise.all([
      listPngs(outputDir),
      listPngs(trackedOutputDir),
    ]);
    assert.deepEqual(generatedFiles, trackedFiles);

    await Promise.all(
      generatedFiles.map(async (file) => {
        const metadata = await sharp(path.join(outputDir, file)).metadata();
        const size = Number(file.match(/(\d+)x\1\.png$/)?.[1]);
        assert.equal(metadata.format, 'png');
        assert.equal(metadata.width, size);
        assert.equal(metadata.height, size);
      })
    );
  });
});

test('default generation refreshes the primary favicon at its source size', async () => {
  await runGenerator();

  const [primary, generated] = await Promise.all([
    readFile(primaryOutputPath),
    readFile(path.join(trackedOutputDir, 'favicon-512x512.png')),
  ]);
  assert.deepEqual(primary, generated);
});

test('custom sizes are deduplicated', async () => {
  await withTempOutput(async (outputDir) => {
    await runGenerator('--output-dir', outputDir, '--sizes', '24,24,96');
    assert.deepEqual(await listPngs(outputDir), [
      'favicon-24x24.png',
      'favicon-96x96.png',
    ]);
  });
});

test('--help succeeds and invalid sizes fail clearly', async () => {
  const help = await runGenerator('--help');
  assert.match(help.stdout, /Usage: pnpm generate:favicons/);

  await assert.rejects(
    () => runGenerator('--sizes', '0'),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Invalid icon size: 0/);
      return true;
    }
  );
});
