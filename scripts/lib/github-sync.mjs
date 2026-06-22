import path from 'node:path';
import process from 'node:process';
import {
  fileExists,
  isRetriableGithubError,
  resolveGithubConfig,
} from './github-api.mjs';

const repoRoot = process.cwd();

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function withGithubSync(
  outputPath,
  generate,
  { onFallback } = {}
) {
  const { getToken, offlineMode } = resolveGithubConfig();
  const token = await getToken();
  const apiOptions = { token, offlineMode };

  try {
    await generate({ token, offlineMode, apiOptions });
    console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
  } catch (error) {
    const hasOutput = await fileExists(outputPath);
    const message = errorMessage(error);

    if (hasOutput && isRetriableGithubError(error, Boolean(token))) {
      if (onFallback) await onFallback();
      console.warn(
        `Warning: ${message}. Using existing ${path.relative(repoRoot, outputPath)}`
      );
      return;
    }

    throw error;
  }
}

export async function runScript(main) {
  try {
    await main();
  } catch (error) {
    console.error(errorMessage(error));
    process.exitCode = 1;
  }
}
