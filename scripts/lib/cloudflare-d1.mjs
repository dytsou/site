const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_DATABASE_NAME = 'site-recent-github-activity';

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function getD1Config(env = process.env) {
  const apiToken = String(env.CLOUDFLARE_API_TOKEN ?? '').trim();
  const accountId = String(env.CLOUDFLARE_ACCOUNT_ID ?? '').trim();
  const databaseName = String(
    env.GITHUB_ACTIVITY_DATABASE_NAME ?? DEFAULT_DATABASE_NAME
  ).trim();
  const missing = [];

  if (!apiToken) missing.push('CLOUDFLARE_API_TOKEN');
  if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!databaseName) missing.push('GITHUB_ACTIVITY_DATABASE_NAME');

  return { apiToken, accountId, databaseName, missing };
}

export function hasD1Config(env = process.env) {
  return getD1Config(env).missing.length === 0;
}

export function createD1Client({
  apiToken,
  accountId,
  databaseName,
  fetchImpl = globalThis.fetch,
}) {
  const missing = [];
  if (!apiToken) missing.push('CLOUDFLARE_API_TOKEN');
  if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!databaseName) missing.push('GITHUB_ACTIVITY_DATABASE_NAME');

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare D1 configuration is incomplete. Missing ${missing.join(', ')}`
    );
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('Cloudflare D1 requires a fetch implementation');
  }

  async function request(path, { method = 'GET', body } = {}) {
    let response;
    try {
      response = await fetchImpl(`${CLOUDFLARE_API_BASE}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        signal: AbortSignal.timeout(CLOUDFLARE_REQUEST_TIMEOUT_MS),
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      throw new Error(`Cloudflare D1 request failed: ${errorMessage(error)}`, {
        cause: error,
      });
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(
        `Cloudflare D1 request failed with HTTP ${response.status}`
      );
    }

    if (!response.ok || payload?.success !== true) {
      const messages = Array.isArray(payload?.errors)
        ? payload.errors
            .map((error) => error?.message)
            .filter(Boolean)
            .join('; ')
        : '';
      const detail = messages || `HTTP ${response.status}`;
      throw new Error(`Cloudflare D1 request failed: ${detail}`);
    }

    return payload.result;
  }

  async function resolveDatabaseId() {
    const query = new URLSearchParams({ name: databaseName });
    const databases = await request(
      `/accounts/${encodeURIComponent(accountId)}/d1/database?${query}`
    );
    const matches = (Array.isArray(databases) ? databases : []).filter(
      (database) => database?.name === databaseName
    );

    if (matches.length === 0) {
      throw new Error(`Cloudflare D1 database not found: ${databaseName}`);
    }

    if (matches.length > 1) {
      throw new Error(
        `Cloudflare D1 database name is not unique: ${databaseName}`
      );
    }

    const databaseId = matches[0]?.uuid;
    if (!databaseId) {
      throw new Error(`Cloudflare D1 database has no UUID: ${databaseName}`);
    }

    return databaseId;
  }

  return {
    async query(sql, params = []) {
      if (!sql || typeof sql !== 'string') {
        throw new Error('Cloudflare D1 queries require a SQL string');
      }

      const databaseId = await resolveDatabaseId();
      const result = await request(
        `/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`,
        {
          method: 'POST',
          body: {
            sql,
            params: params.map((param) => String(param)),
          },
        }
      );

      const queryResult = Array.isArray(result) ? result[0] : result;
      if (!queryResult?.success) {
        throw new Error('Cloudflare D1 query returned an unsuccessful result');
      }

      return queryResult;
    },
  };
}

export function createD1ClientFromEnv(env = process.env) {
  return createD1Client(getD1Config(env));
}
