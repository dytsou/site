import path from 'node:path';

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function isHttpsUrl(value) {
  return typeof value === 'string' && value.startsWith('https://');
}

export function isOwnerRepo(value) {
  return typeof value === 'string' && /^[^/]+\/[^/]+$/.test(value);
}

export function isSlashPath(value) {
  return typeof value === 'string' && value.startsWith('/');
}

/** @param {string} repoRoot @param {string} relativePath */
export function resolveSafeRepoPath(repoRoot, relativePath) {
  assert(!path.isAbsolute(relativePath), 'path must be relative');
  assert(!relativePath.includes('..'), 'path must not contain ..');
  const resolved = path.resolve(repoRoot, relativePath);
  const rootPrefix = repoRoot.endsWith(path.sep)
    ? repoRoot
    : `${repoRoot}${path.sep}`;
  assert(
    resolved === repoRoot || resolved.startsWith(rootPrefix),
    'path must stay inside workspace'
  );
  return resolved;
}

export async function runVerifier(name, main) {
  try {
    await main();
  } catch {
    console.error(`${name} failed`);
    process.exitCode = 1;
  }
}
