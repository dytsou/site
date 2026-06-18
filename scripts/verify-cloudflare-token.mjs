import process from 'node:process';

const accountId = 'c457ded6af8937c1aa9032b5396f2f05';
const workerName = 'dytsou-site-edge';

const requiredPermissions = [
  'Account > Workers Scripts > Edit (required)',
  'Zone > Workers Routes > Edit (if deploying routes in wrangler.toml)',
  'Zone > DNS > Edit (only for DNS-AID script)',
];

async function cloudflareRequest(path) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  const payload = await response.json();
  return { response, payload };
}

function printSetupInstructions() {
  console.error(`
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
`);
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error('CLOUDFLARE_API_TOKEN is not set.');
    process.exit(1);
  }

  const { response: verifyResponse, payload: verifyPayload } =
    await cloudflareRequest('/user/tokens/verify');

  if (!verifyPayload.success) {
    console.error(
      'Token verification failed:',
      JSON.stringify(verifyPayload.errors)
    );
    printSetupInstructions();
    process.exit(1);
  }

  console.log(`✓ Token is active (status: ${verifyPayload.result?.status})`);

  const { response: scriptsResponse, payload: scriptsPayload } =
    await cloudflareRequest(`/accounts/${accountId}/workers/scripts`);

  if (!scriptsPayload.success) {
    console.error(
      'Token cannot access Workers Scripts API:',
      JSON.stringify(scriptsPayload.errors)
    );
    console.error(`Required permissions:\n${requiredPermissions.map((p) => `  - ${p}`).join('\n')}`);
    printSetupInstructions();
    process.exit(1);
  }

  console.log('✓ Token can access Workers Scripts API');

  const { payload: servicePayload } = await cloudflareRequest(
    `/accounts/${accountId}/workers/services/${workerName}`
  );

  if (servicePayload.success) {
    console.log(`✓ Worker service "${workerName}" is accessible`);
  } else if (scriptsResponse.ok) {
    console.log(
      `✓ Worker service "${workerName}" not found yet (deploy will create it)`
    );
  }

  console.log('✓ Cloudflare token is ready for worker deploy');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
