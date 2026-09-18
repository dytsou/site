import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createD1Client, getD1Config } from './lib/cloudflare-d1.mjs';
import {
  renderGitHubActivityTypeScript,
  selectGitHubActivityRepositories,
  validateGitHubActivitySnapshot,
} from './lib/github-activity.mjs';
import {
  readGitHubActivitySnapshot,
  writeGitHubActivitySnapshot,
} from './lib/github-activity-snapshot.mjs';
import { syncGitHubActivitySnapshot } from './lib/github-activity-sync.mjs';
import { loadGitHubActivitySnapshot } from './load-github-activity-snapshot.mjs';

function sourceRepository(name, overrides = {}) {
  return {
    name,
    description: `${name} description`,
    html_url: `https://github.com/dytsou/${name}`,
    stargazers_count: 1,
    language: 'TypeScript',
    owner: { login: 'dytsou' },
    fork: false,
    private: false,
    ...overrides,
  };
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
  };
}

test('selects six owned public non-fork repositories in source order', () => {
  const repositories = [
    sourceRepository('first'),
    sourceRepository('forked', { fork: true }),
    sourceRepository('private', { private: true }),
    sourceRepository('foreign', { owner: { login: 'someone-else' } }),
    sourceRepository('second'),
    sourceRepository('third'),
    sourceRepository('fourth'),
    sourceRepository('fifth'),
    sourceRepository('sixth'),
    sourceRepository('seventh'),
  ];

  const selected = selectGitHubActivityRepositories(repositories);

  assert.deepEqual(
    selected.map((repository) => repository.name),
    ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
  );
  assert.deepEqual(Object.keys(selected[0]), [
    'name',
    'description',
    'html_url',
    'stargazers_count',
    'language',
  ]);
});

test('rejects empty, oversized, or malformed snapshots', () => {
  assert.throws(
    () => validateGitHubActivitySnapshot([]),
    /must contain at least one repository/
  );
  assert.throws(
    () =>
      validateGitHubActivitySnapshot(
        Array.from({ length: 7 }, (_, i) => ({
          name: `repo-${i}`,
          description: '',
          html_url: `https://github.com/dytsou/repo-${i}`,
          stargazers_count: 0,
          language: null,
        }))
      ),
    /cannot contain more than 6/
  );
  assert.throws(
    () =>
      validateGitHubActivitySnapshot([
        {
          name: 'bad',
          description: '',
          html_url: 'https://example.com/bad',
          stargazers_count: 0,
          language: null,
        },
      ]),
    /invalid repository data/
  );
});

test('D1 client resolves the named database and sends parameterized queries', async () => {
  const calls = [];
  const client = createD1Client({
    apiToken: 'test-token',
    accountId: 'account-id',
    databaseName: 'site-recent-github-activity',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/d1/database?')) {
        return jsonResponse({
          success: true,
          result: [
            {
              name: 'site-recent-github-activity',
              uuid: 'database-id',
            },
          ],
        });
      }

      return jsonResponse({
        success: true,
        result: [
          {
            success: true,
            results: [{ snapshot_key: 'recent-github-activity' }],
          },
        ],
      });
    },
  });

  const result = await client.query('SELECT * FROM snapshots WHERE key = ?', [
    'recent-github-activity',
  ]);

  assert.deepEqual(result.results, [
    { snapshot_key: 'recent-github-activity' },
  ]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.equal(calls[0].options.signal.aborted, false);
  assert.equal(typeof calls[0].options.signal.addEventListener, 'function');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    sql: 'SELECT * FROM snapshots WHERE key = ?',
    params: ['recent-github-activity'],
  });
});

test('snapshot helpers write and read one validated last-success row', async () => {
  const repositories = [
    {
      name: 'site',
      description: 'Personal site',
      html_url: 'https://github.com/dytsou/site',
      stargazers_count: 0,
      language: 'TypeScript',
    },
  ];
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT')) {
        return {
          results: [
            {
              repos_json: JSON.stringify(repositories),
              updated_at: '2026-09-18T00:00:00.000Z',
            },
          ],
        };
      }
      return { results: [] };
    },
  };

  await writeGitHubActivitySnapshot(
    client,
    repositories,
    '2026-09-18T00:00:00.000Z'
  );
  const snapshot = await readGitHubActivitySnapshot(client);

  assert.match(calls[0].sql, /ON CONFLICT\(snapshot_key\)/);
  assert.deepEqual(calls[0].params, [
    'recent-github-activity',
    JSON.stringify(repositories),
    '2026-09-18T00:00:00.000Z',
  ]);
  assert.deepEqual(snapshot, {
    repositories,
    updatedAt: '2026-09-18T00:00:00.000Z',
  });
});

test('snapshot reader returns null when the keyed row is missing', async () => {
  const client = {
    query: async () => ({ results: [] }),
  };

  assert.equal(await readGitHubActivitySnapshot(client), null);
});

test('sync keeps the last valid snapshot when GitHub refresh fails', async () => {
  const previousRepositories = [
    {
      name: 'site',
      description: 'Personal site',
      html_url: 'https://github.com/dytsou/site',
      stargazers_count: 0,
      language: 'TypeScript',
    },
  ];
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return {
        results: [
          {
            repos_json: JSON.stringify(previousRepositories),
            updated_at: '2026-09-18T00:00:00.000Z',
          },
        ],
      };
    },
  };

  const result = await syncGitHubActivitySnapshot({
    client,
    getToken: async () => 'test-token',
    fetchRepositories: async () => {
      throw new Error('GitHub unavailable');
    },
  });

  assert.deepEqual(result, {
    status: 'stale',
    updatedAt: '2026-09-18T00:00:00.000Z',
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^SELECT/);
});

test('sync rethrows refresh failures when no previous snapshot exists', async () => {
  const client = {
    query: async () => ({ results: [] }),
  };

  await assert.rejects(
    () =>
      syncGitHubActivitySnapshot({
        client,
        getToken: async () => 'test-token',
        fetchRepositories: async () => {
          throw new Error('GitHub unavailable');
        },
      }),
    /GitHub unavailable/
  );
});

test('sync keeps the last valid snapshot when the upstream feed is invalid', async () => {
  const client = {
    query: async () => ({
      results: [
        {
          repos_json: JSON.stringify([
            {
              name: 'site',
              description: 'Personal site',
              html_url: 'https://github.com/dytsou/site',
              stargazers_count: 0,
              language: 'TypeScript',
            },
          ]),
          updated_at: '2026-09-18T00:00:00.000Z',
        },
      ],
    }),
  };

  const result = await syncGitHubActivitySnapshot({
    client,
    getToken: async () => 'test-token',
    fetchRepositories: async () => [],
  });

  assert.deepEqual(result, {
    status: 'stale',
    updatedAt: '2026-09-18T00:00:00.000Z',
  });
});

test('required loader rejects missing D1 configuration', async () => {
  await assert.rejects(
    () =>
      loadGitHubActivitySnapshot({
        env: { GITHUB_ACTIVITY_SNAPSHOT_REQUIRED: '1' },
      }),
    /snapshot is required, but D1 configuration is incomplete/
  );
});

test('required loader rejects when the D1 snapshot is missing', async () => {
  await assert.rejects(
    () =>
      loadGitHubActivitySnapshot({
        env: {
          CLOUDFLARE_API_TOKEN: 'test-token',
          CLOUDFLARE_ACCOUNT_ID: 'account-id',
          GITHUB_ACTIVITY_SNAPSHOT_REQUIRED: '1',
        },
        createClient: () => ({}),
        readSnapshot: async () => null,
      }),
    /snapshot is required, but no successful snapshot exists/
  );
});

test('optional loader keeps checked-in data without D1 configuration', async () => {
  let clientCreated = false;

  await loadGitHubActivitySnapshot({
    env: {},
    createClient: () => {
      clientCreated = true;
      return {};
    },
  });

  assert.equal(clientCreated, false);
});

test('optional loader keeps checked-in data when the D1 snapshot is missing', async () => {
  let snapshotRead = false;

  await loadGitHubActivitySnapshot({
    env: {
      CLOUDFLARE_API_TOKEN: 'test-token',
      CLOUDFLARE_ACCOUNT_ID: 'account-id',
    },
    createClient: () => ({}),
    readSnapshot: async () => {
      snapshotRead = true;
      return null;
    },
  });

  assert.equal(snapshotRead, true);
});

test('renders the static TypeScript data module', () => {
  const output = renderGitHubActivityTypeScript([
    {
      name: 'site',
      description: 'Personal site',
      html_url: 'https://github.com/dytsou/site',
      stargazers_count: 0,
      language: 'TypeScript',
    },
  ]);

  assert.match(output, /export type GitHubActivityRepo/);
  assert.match(output, /export const GITHUB_ACTIVITY_REPOS/);
  assert.match(output, /https:\/\/github\.com\/dytsou\/site/);
});

test('reports missing D1 configuration without exposing values', () => {
  const config = getD1Config({
    CLOUDFLARE_API_TOKEN: '',
    CLOUDFLARE_ACCOUNT_ID: '',
  });

  assert.deepEqual(config.missing, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ]);
});
