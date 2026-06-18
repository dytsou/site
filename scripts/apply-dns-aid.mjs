import process from 'node:process';

const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = 'tsou.me';
const siteHost = 'dy.tsou.me';

const records = [
  {
    type: 'HTTPS',
    name: '_index._agents.dy',
    data: {
      priority: 1,
      target: '.',
      value: 'alpn=h3,h2 ipv4hint=104.21.33.118,172.67.162.86',
    },
    ttl: 3600,
  },
  {
    type: 'SVCB',
    name: '_index._agents.dy',
    data: {
      priority: 1,
      target: siteHost,
      value: 'port=443 alpn=h3,h2',
    },
    ttl: 3600,
  },
];

function fqdn(recordName) {
  return `${recordName}.${zoneName}`;
}

async function cloudflare(path, options = {}) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}${path}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      ...options,
    }
  );
  return response.json();
}

async function listRecords(type, name) {
  const params = new URLSearchParams({ type, name });
  const payload = await cloudflare(`/dns_records?${params}`);
  if (!payload.success) {
    throw new Error(
      `Failed to list DNS records: ${JSON.stringify(payload.errors)}`
    );
  }
  return payload.result;
}

async function upsertRecord(record) {
  const fullName = fqdn(record.name);
  const existing = (await listRecords(record.type, fullName)).find(
    (entry) => entry.type === record.type
  );

  const body = {
    type: record.type,
    name: record.name,
    ttl: record.ttl,
    data: record.data,
  };

  const path = existing ? `/dns_records/${existing.id}` : '/dns_records';
  const method = existing ? 'PUT' : 'POST';

  const payload = await cloudflare(path, {
    method,
    body: JSON.stringify(body),
  });

  if (!payload.success) {
    const alreadyExists = payload.errors?.some((error) => error.code === 81058);
    if (alreadyExists) {
      console.log(`✓ ${record.type} ${fullName} already exists`);
      return;
    }
    throw new Error(
      `Failed to ${existing ? 'update' : 'create'} ${record.type} ${fullName}: ${JSON.stringify(payload.errors)}`
    );
  }

  console.log(`✓ ${existing ? 'Updated' : 'Created'} ${record.type} ${fullName}`);
}

async function main() {
  if (!zoneId || !apiToken) {
    console.error(
      'Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN to apply DNS-AID records.'
    );
    process.exit(1);
  }

  for (const record of records) {
    await upsertRecord(record);
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
