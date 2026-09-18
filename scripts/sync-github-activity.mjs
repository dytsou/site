import { createD1ClientFromEnv } from './lib/cloudflare-d1.mjs';
import { syncGitHubActivitySnapshot } from './lib/github-activity-sync.mjs';
import { resolveGithubConfig } from './lib/github-api.mjs';
import { runScript } from './lib/github-sync.mjs';

await runScript(async () => {
  const client = createD1ClientFromEnv();
  const { getToken, offlineMode } = resolveGithubConfig();
  const result = await syncGitHubActivitySnapshot({
    client,
    getToken,
    offlineMode,
  });

  if (result.status === 'updated') {
    console.log(`Stored GitHub activity snapshot at ${result.updatedAt}`);
  } else {
    console.log(`Kept GitHub activity snapshot from ${result.updatedAt}`);
  }
});
