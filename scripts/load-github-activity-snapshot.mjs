import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { createD1ClientFromEnv, getD1Config } from './lib/cloudflare-d1.mjs';
import { renderGitHubActivityTypeScript } from './lib/github-activity.mjs';
import { readGitHubActivitySnapshot } from './lib/github-activity-snapshot.mjs';
import { runScript } from './lib/github-sync.mjs';

const defaultOutputPath = path.join(
  process.cwd(),
  'src/data/GitHubActivity.generated.ts'
);

function isRequiredSnapshotMode(env = process.env) {
  return ['1', 'true'].includes(
    String(env.GITHUB_ACTIVITY_SNAPSHOT_REQUIRED ?? '').toLowerCase()
  );
}

async function formatGeneratedTypeScript(code, targetPath) {
  const config = await prettier.resolveConfig(targetPath);
  return prettier.format(code, { ...config, filepath: targetPath });
}

export async function loadGitHubActivitySnapshot({
  env = process.env,
  outputPath: targetPath = defaultOutputPath,
  createClient = createD1ClientFromEnv,
  readSnapshot = readGitHubActivitySnapshot,
} = {}) {
  const required = isRequiredSnapshotMode(env);
  const config = getD1Config(env);

  if (config.missing.length > 0) {
    if (required) {
      throw new Error(
        `GitHub activity snapshot is required, but D1 configuration is incomplete. Missing ${config.missing.join(', ')}`
      );
    }

    console.warn(
      `Cloudflare D1 is not configured. Keeping ${path.relative(process.cwd(), targetPath)}`
    );
    return;
  }

  const snapshot = await readSnapshot(createClient(env));

  if (!snapshot) {
    if (required) {
      throw new Error(
        'GitHub activity snapshot is required, but no successful snapshot exists'
      );
    }

    console.warn(
      'No successful GitHub activity snapshot exists. Keeping checked-in activity data.'
    );
    return;
  }

  const output = await formatGeneratedTypeScript(
    renderGitHubActivityTypeScript(snapshot.repositories),
    targetPath
  );
  const temporaryPath = `${targetPath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, output);
  await rename(temporaryPath, targetPath);
  console.log(
    `Materialized GitHub activity snapshot from ${snapshot.updatedAt}`
  );
}

const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMainModule) {
  await runScript(() => loadGitHubActivitySnapshot());
}
