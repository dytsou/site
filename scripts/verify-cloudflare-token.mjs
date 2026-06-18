import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const wranglerToml = readFileSync(
  path.join(process.cwd(), 'workers/site-edge/wrangler.toml'),
  'utf8'
);

// ponytail: naive TOML string parse; fine for flat name/account_id in wrangler.toml
function wranglerString(key) {
  const match = wranglerToml.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'));
  if (!match) {
    throw new Error(`workers/site-edge/wrangler.toml: missing ${key}`);
  }
  return match[1];
}

const accountId = wranglerString('account_id');
const workerName = wranglerString('name');

const SETUP_INSTRUCTIONS = `
Cloudflare API token is missing required permissions for worker deploy.

Create a token from your user profile (not the account tokens page):
  https://dash.cloudflare.com/profile/api-tokens

Easiest: click "Create Token" → choose "Edit Cloudflare Workers" template
  - Account resources: include your account (tsou.me)
  - Zone resources: include tsou.me

Minimum custom permissions:
  - Account > Workers Scripts > Edit
  - Zone > Workers Routes > Edit   (under "Zone", not "Account")
  - Zone > DNS > Edit              (only needed for DNS-AID)

Do NOT use the Global API Key. Use an API Token.

Then update the CLOUDFLARE_API_TOKEN secret in:
  https://github.com/dytsou/site/settings/secrets/actions
`;

function fail(...messages) {
  for (const message of messages) {
    console.error(message);
  }
  console.error(SETUP_INSTRUCTIONS);
  process.exit(1);
}

async function cloudflareRequest(token, apiPath) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4${apiPath}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error('CLOUDFLARE_API_TOKEN is not set.');
    process.exit(1);
  }

  const verifyPayload = await cloudflareRequest(token, '/user/tokens/verify');
  if (!verifyPayload.success) {
    fail('Token verification failed. Check token validity and permissions.');
  }
  if (verifyPayload.result?.status !== 'active') {
    fail('Token is not active. Create or refresh the API token.');
  }
  console.log('✓ Token is active.');

  const scriptsPayload = await cloudflareRequest(
    token,
    `/accounts/${accountId}/workers/scripts`
  );
  if (!scriptsPayload.success) {
    fail('Token cannot access Workers Scripts API. Check token permissions.');
  }
  console.log('✓ Token can access Workers Scripts API');

  const servicePayload = await cloudflareRequest(
    token,
    `/accounts/${accountId}/workers/services/${workerName}`
  );
  if (servicePayload.success) {
    console.log(`✓ Worker service "${workerName}" is accessible`);
  } else {
    console.log(
      `✓ Worker service "${workerName}" not found yet (deploy will create it)`
    );
  }

  console.log('✓ Cloudflare token is ready for worker deploy');
}

try {
  await main();
} catch {
  console.error('Cloudflare token verification failed unexpectedly.');
  process.exit(1);
}
