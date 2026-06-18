import process from 'node:process';

const zoneId = process.env.CLOUDFLARE_ZONE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
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

async function listRecords(name) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=HTTPS,SVCB&name=${name}.${siteHost}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(`Failed to list DNS records: ${JSON.stringify(payload.errors)}`);
  }
  return payload.result;
}

async function upsertRecord(record) {
  const fqdn = `${record.name}.${siteHost}`;
  const existing = (await listRecords(record.name)).find(
    (entry) => entry.type === record.type && entry.name === fqdn
  );

  const body = {
    type: record.type,
    name: record.name,
    ttl: record.ttl,
    data: record.data,
  };

  const url = existing
    ? `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`
    : `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
  const method = existing ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(
      `Failed to ${existing ? 'update' : 'create'} ${record.type} ${fqdn}: ${JSON.stringify(payload.errors)}`
    );
  }
  console.log(`✓ ${existing ? 'Updated' : 'Created'} ${record.type} ${fqdn}`);
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
