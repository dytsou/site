import { validateGitHubActivitySnapshot } from './github-activity.mjs';

export const GITHUB_ACTIVITY_SNAPSHOT_KEY = 'recent-github-activity';

export async function writeGitHubActivitySnapshot(
  client,
  repositories,
  updatedAt
) {
  validateGitHubActivitySnapshot(repositories);

  await client.query(
    `INSERT INTO github_activity_snapshots (snapshot_key, repos_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(snapshot_key) DO UPDATE SET
       repos_json = excluded.repos_json,
       updated_at = excluded.updated_at`,
    [GITHUB_ACTIVITY_SNAPSHOT_KEY, JSON.stringify(repositories), updatedAt]
  );
}

export async function readGitHubActivitySnapshot(client) {
  const result = await client.query(
    `SELECT repos_json, updated_at
       FROM github_activity_snapshots
      WHERE snapshot_key = ?
      LIMIT 1`,
    [GITHUB_ACTIVITY_SNAPSHOT_KEY]
  );
  const row = result.results?.[0];

  if (!row) return null;

  let repositories;
  try {
    repositories = JSON.parse(row.repos_json);
  } catch {
    throw new Error('GitHub activity snapshot contains invalid JSON');
  }

  validateGitHubActivitySnapshot(repositories);

  if (typeof row.updated_at !== 'string' || row.updated_at.trim() === '') {
    throw new Error('GitHub activity snapshot has no valid update timestamp');
  }

  return { repositories, updatedAt: row.updated_at };
}
