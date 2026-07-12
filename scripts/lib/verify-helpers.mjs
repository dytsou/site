import path from 'node:path';

const FORBIDDEN_SEGMENTS = new Set(['..', '.']);

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

/**
 * Resolve a repo-relative path after segment validation (no path.resolve on raw input).
 * @param {string} repoRoot
 * @param {string} relativePath
 */
export function toSafeRepoPath(repoRoot, relativePath) {
  assert(
    typeof relativePath === 'string' && relativePath.length > 0,
    'path required'
  );
  assert(!path.isAbsolute(relativePath), 'path must be relative');

  const segments = relativePath
    .split(/[/\\]/)
    .filter((segment) => segment.length > 0);
  for (const segment of segments) {
    assert(!FORBIDDEN_SEGMENTS.has(segment), 'invalid path segment');
  }

  const rootResolved = path.resolve(repoRoot);
  const candidate =
    segments.length === 0
      ? rootResolved
      : path.resolve(path.join(rootResolved, ...segments));
  const rootPrefix = rootResolved.endsWith(path.sep)
    ? rootResolved
    : `${rootResolved}${path.sep}`;

  assert(
    candidate === rootResolved || candidate.startsWith(rootPrefix),
    'path must stay inside workspace'
  );
  return candidate;
}

export async function runVerifier(name, main) {
  try {
    await main();
  } catch {
    console.error(`${name} failed`);
    process.exitCode = 1;
  }
}
