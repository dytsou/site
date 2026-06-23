import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, 'public');
const skillsDir = path.join(publicDir, '.well-known/agent-skills');
const siteRoutesPath = path.join(repoRoot, 'src/data/site-routes.json');
const packagePath = path.join(repoRoot, 'package.json');

const SITE_URL = 'https://dy.tsou.me';

function sha256Digest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

async function writeJson(relativePath, value) {
  const target = path.join(publicDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

async function collectSkills() {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    let content;
    try {
      content = await readFile(skillPath, 'utf8');
    } catch {
      throw new Error(`Missing skill file: ${skillPath}`);
    }

    const firstParagraph = content
      .split('\n\n')
      .find((block) => block.trim() && !block.startsWith('#'));
    const description =
      firstParagraph?.replace(/^#+\s.*\n?/m, '').trim() ||
      `Agent skill: ${entry.name}`;

    skills.push({
      name: entry.name,
      type: 'skill-md',
      description,
      url: `/.well-known/agent-skills/${entry.name}/SKILL.md`,
      digest: sha256Digest(content),
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

function oauthAuthorizationServer(version) {
  return {
    issuer: SITE_URL,
    authorization_endpoint: `${SITE_URL}/oauth2/authorize`,
    token_endpoint: `${SITE_URL}/oauth2/token`,
    jwks_uri: `${SITE_URL}/.well-known/jwks.json`,
    grant_types_supported: ['client_credentials'],
    response_types_supported: ['token'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['site.read'],
    agent_auth: {
      skill: `${SITE_URL}/auth.md`,
      register_uri: `${SITE_URL}/agent/identity`,
      identity_types_supported: ['anonymous'],
      anonymous: {
        credential_types_supported: ['none'],
      },
      claim_uri: `${SITE_URL}/agent/identity/claim`,
    },
  };
}

function oauthProtectedResource() {
  return {
    resource: `${SITE_URL}/`,
    resource_name: 'Dong-You Tsou',
    authorization_servers: [SITE_URL],
    scopes_supported: ['site.read'],
    bearer_methods_supported: ['header'],
  };
}

function mcpServerCard(version) {
  return {
    serverInfo: {
      name: 'dy.tsou.me',
      version,
    },
    description:
      'Personal portfolio with in-browser WebMCP tools for navigation, project search, experiences, and contact info.',
    url: `${SITE_URL}/`,
    transport: {
      type: 'webmcp',
    },
    capabilities: {
      tools: true,
    },
  };
}

function apiCatalog() {
  return {
    linkset: [
      {
        anchor: `${SITE_URL}/`,
        item: [
          {
            href: `${SITE_URL}/sitemap.xml`,
            rel: 'service-desc',
            title: 'Site pages and update frequency',
          },
          {
            href: `${SITE_URL}/robots.txt`,
            rel: 'service-desc',
            title: 'Crawler policy',
          },
          {
            href: `${SITE_URL}/.well-known/oauth-protected-resource`,
            rel: 'oauth-protected-resource',
            title: 'OAuth protected resource metadata',
          },
          {
            href: `${SITE_URL}/.well-known/oauth-authorization-server`,
            rel: 'oauth-authorization-server',
            title: 'OAuth authorization server metadata',
          },
          {
            href: `${SITE_URL}/.well-known/mcp/server-card.json`,
            rel: 'mcp-server-card',
            title: 'MCP server card',
          },
          {
            href: `${SITE_URL}/.well-known/agent-skills/index.json`,
            rel: 'agent-skills',
            title: 'Agent skills discovery index',
          },
          {
            href: `${SITE_URL}/auth.md`,
            rel: 'agent-auth',
            title: 'Agent registration and authentication',
          },
        ],
      },
    ],
  };
}

function authMd() {
  return `# dy.tsou.me auth.md

Agent authentication and registration for Dong-You Tsou's personal portfolio.

## Audience

AI agents interacting with ${SITE_URL}/

## Discovery

1. Protected Resource Metadata: \`/.well-known/oauth-protected-resource\`
2. Authorization Server Metadata: \`/.well-known/oauth-authorization-server\`
3. MCP Server Card: \`/.well-known/mcp/server-card.json\`
4. Agent Skills: \`/.well-known/agent-skills/index.json\`

## Access model

Public portfolio pages require no credentials. Request pages with \`Accept: text/markdown\` for agent-friendly content, or load the site in a browser context to use WebMCP tools via \`navigator.modelContext\`.

### Anonymous (read-only)

No registration is required for read-only access.

- Supported scope: \`site.read\`
- Credential type: none
- WebMCP tools are available after loading ${SITE_URL}/ in a browser session

## WebMCP tools

| Tool | Purpose |
| --- | --- |
| \`navigate\` | Open site pages |
| \`get_site_info\` | Site metadata and routes |
| \`search_projects\` | Search portfolio projects |
| \`get_experiences\` | Work and education history |
| \`get_contact_info\` | Contact links and calendar |
| \`get_theme\` / \`set_theme\` | Read or switch color theme |

## Contact

Email: contact@dy.tsou.me
`;
}

async function main() {
  await readFile(siteRoutesPath, 'utf8');
  const { version } = JSON.parse(await readFile(packagePath, 'utf8'));
  const skills = await collectSkills();

  if (skills.length === 0) {
    throw new Error(
      'No agent skills found under public/.well-known/agent-skills/'
    );
  }

  await writeJson(
    '.well-known/oauth-authorization-server',
    oauthAuthorizationServer(version)
  );
  await writeJson(
    '.well-known/oauth-protected-resource',
    oauthProtectedResource()
  );
  await writeJson('.well-known/jwks.json', { keys: [] });
  await writeJson('.well-known/mcp/server-card.json', mcpServerCard(version));
  await writeJson('.well-known/agent-skills/index.json', {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills,
  });
  await writeJson('.well-known/api-catalog', apiCatalog());
  await writeFile(path.join(publicDir, 'auth.md'), authMd());

  // ponytail: self-check — fails if required discovery fields disappear
  const as = oauthAuthorizationServer(version);
  for (const key of [
    'issuer',
    'authorization_endpoint',
    'token_endpoint',
    'jwks_uri',
    'grant_types_supported',
    'response_types_supported',
  ]) {
    if (!(key in as))
      throw new Error(`oauth-authorization-server missing ${key}`);
  }
  if (!as.agent_auth?.register_uri) {
    throw new Error(
      'oauth-authorization-server missing agent_auth.register_uri'
    );
  }

  console.log(`✓ emit-agent-discovery wrote ${skills.length} skill(s)`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
