import { fetchOwnedPublicRepos } from './github-api.mjs';
import {
  GITHUB_ACTIVITY_USERNAME,
  selectGitHubActivityRepositories,
  validateGitHubActivitySnapshot,
} from './github-activity.mjs';
import {
  readGitHubActivitySnapshot,
  writeGitHubActivitySnapshot,
} from './github-activity-snapshot.mjs';

export async function syncGitHubActivitySnapshot({
  client,
  getToken,
  offlineMode,
  fetchRepositories = fetchOwnedPublicRepos,
  now = () => new Date(),
}) {
  let repositories;

  try {
    const token = await getToken();
    const ownedRepos = await fetchRepositories(GITHUB_ACTIVITY_USERNAME, {
      token,
      offlineMode,
    });
    repositories = selectGitHubActivityRepositories(ownedRepos);
    validateGitHubActivitySnapshot(repositories);
  } catch (error) {
    const previousSnapshot = await readGitHubActivitySnapshot(client);

    if (!previousSnapshot) {
      throw error;
    }

    console.warn(
      `GitHub activity refresh failed; retaining last successful snapshot from ${previousSnapshot.updatedAt}`
    );
    return {
      status: 'stale',
      updatedAt: previousSnapshot.updatedAt,
    };
  }

  const updatedAt = now().toISOString();

  await writeGitHubActivitySnapshot(client, repositories, updatedAt);
  return { status: 'updated', updatedAt };
}
