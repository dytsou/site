import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { readFile } from 'node:fs/promises';

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, 'public');
const siteUrl = 'https://dy.tsou.me';
const generatedAt = new Date().toISOString().slice(0, 10);

let siteVersion = '1.0.0';
try {
  const packageJson = JSON.parse(
    await readFile(path.join(repoRoot, 'package.json'), 'utf8')
  );
  siteVersion = packageJson.version ?? siteVersion;
} catch {
  // keep default
}

const siteRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/experiences', changefreq: 'monthly', priority: '0.8' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
];

const pageMarkdown = {
  '/': `# Dong-You Tsou

Full-Stack Developer

A computer science student at NYCU, passionate about building scalable systems, leading developer communities, and creating innovative solutions.

## Links

- [About](${siteUrl}/about)
- [Experiences](${siteUrl}/experiences)
- [Projects](${siteUrl}/projects)
- [Contact](${siteUrl}/contact)
- [Resume](${siteUrl}/resume)
- [GitHub](https://github.com/dytsou)
- [LinkedIn](https://www.linkedin.com/in/dytsou/)
`,
  '/about': `# About Me

Student engineer focused on backend scalability, full-stack product craft, and applied research.

I'm a Computer Science student at **National Yang Ming Chiao Tung University** in Taiwan. I'm passionate about building scalable backend systems and creating seamless full-stack applications.

As Vice President of NYCU Software Development Club, I lead a community of developers and organize technical workshops. I also serve on the Agenda Committee for SITCON, Taiwan's largest student-run tech conference.

My research experience spans research testing on software quality at the Software Quality Lab and video-based 3D object detection on autonomous driving at the Applied Computing and Multimedia Lab.
`,
  '/experiences': `# Experience

## Vice President — NYCU Software Development Club

Oct 2023 - Present · Hsinchu, Taiwan

- Leading a community of 100+ student developers
- Organizing technical workshops and hackathons
- Managing club operations and strategic planning

## Agenda Committee — SITCON

Oct 2024 - Mar 2025 · Taiwan

- Curating technical content for Taiwan's largest student tech conference
- Reviewing and selecting speaker proposals

## Software Quality Lab — NYCU

Sep 2025 - Present

- Researching impact of AI-generated testing on software quality

## Applied Computing and Multimedia Lab — NYCU

Feb 2025 - Aug 2025

- Video-based 3D object detection for autonomous driving
`,
  '/projects': `# Projects

Featured open-source and community projects are listed on the site and synced from GitHub. Visit [${siteUrl}/projects](${siteUrl}/projects) in a browser for the live carousel, or use the WebMCP \`list_projects\` tool when available.

Source repositories: [github.com/dytsou](https://github.com/dytsou)
`,
  '/contact': `# Get In Touch

I'm always open to discussing new projects, opportunities, or just having a chat about technology.

## Contact

- LinkedIn: [linkedin.com/in/dytsou](https://www.linkedin.com/in/dytsou/)
- GitHub: [@dytsou](https://github.com/dytsou)
- Email: [contact@dy.tsou.me](mailto:contact@dy.tsou.me)
- Calendar: [${siteUrl}/cal](${siteUrl}/cal)

## Open To

- Backend development roles
- Full-stack engineering positions
- Research collaborations
- Quality assurance engineering positions
`,
};

const agentSkills = [
  {
    name: 'site-navigation',
    type: 'skill-md',
    description:
      'Navigate the personal site and retrieve canonical page URLs for Dong-You Tsou.',
    content: `# Site Navigation

Use these canonical URLs:

- Home: ${siteUrl}/
- About: ${siteUrl}/about
- Experiences: ${siteUrl}/experiences
- Projects: ${siteUrl}/projects
- Contact: ${siteUrl}/contact
- Resume: ${siteUrl}/resume

Prefer \`Accept: text/markdown\` when fetching page content.
`,
  },
  {
    name: 'contact-dytsou',
    type: 'skill-md',
    description:
      'Contact Dong-You Tsou via email, LinkedIn, GitHub, or calendar booking.',
    content: `# Contact Dong-You Tsou

- Email: contact@dy.tsou.me
- LinkedIn: https://www.linkedin.com/in/dytsou/
- GitHub: https://github.com/dytsou
- Calendar: ${siteUrl}/cal

No authentication is required to view public site content.
`,
  },
];

function sha256(content) {
  return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`;
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

function buildSitemap() {
  const urls = siteRoutes
    .map(
      ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${siteUrl}${routePath === '/' ? '' : routePath}</loc>
    <lastmod>${generatedAt}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function buildAuthMd() {
  return `# auth.md

## Audience

AI agents and automated clients that need to discover or interact with ${siteUrl}.

## Agent registration

Public content on this site does not require credentials. Agents may access pages and discovery documents immediately using the anonymous registration method below.

### Method: anonymous

- **Identity type:** anonymous
- **Registration endpoint:** none (open access; no account creation)
- **Provisioning:** immediate on first request
- **Credential types:** none
- **Credential use:** no bearer token is required for public pages, \`.well-known\` discovery documents, or agent skills
- **Claim URI:** ${siteUrl}/auth.md#anonymous

## Protected resources

This site has no protected APIs. All published pages and discovery documents are public.

## Discovery

- API catalog: ${siteUrl}/.well-known/api-catalog
- Agent skills: ${siteUrl}/.well-known/agent-skills/index.json
- OAuth protected resource: ${siteUrl}/.well-known/oauth-protected-resource
- OAuth authorization server: ${siteUrl}/.well-known/oauth-authorization-server
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
- Sitemap: ${siteUrl}/sitemap.xml

## Contact

For human outreach, see ${siteUrl}/contact.
`;
}

function buildApiCatalog() {
  return JSON.stringify(
    {
      linkset: [
        {
          anchor: siteUrl,
          'service-doc': [{ href: `${siteUrl}/auth.md`, type: 'text/markdown' }],
          describedby: [
            { href: `${siteUrl}/.well-known/agent-skills/index.json` },
            { href: `${siteUrl}/.well-known/mcp/server-card.json` },
          ],
        },
      ],
    },
    null,
    2
  );
}

function buildOAuthProtectedResource() {
  return JSON.stringify(
    {
      resource: siteUrl,
      authorization_servers: [siteUrl],
      scopes_supported: [],
      bearer_methods_supported: ['header'],
    },
    null,
    2
  );
}

function buildOAuthAuthorizationServer() {
  return JSON.stringify(
    {
      issuer: siteUrl,
      authorization_endpoint: `${siteUrl}/.well-known/oauth-authorization-server`,
      token_endpoint: `${siteUrl}/.well-known/oauth-authorization-server`,
      jwks_uri: `${siteUrl}/.well-known/jwks.json`,
      grant_types_supported: [],
      response_types_supported: [],
      agent_auth: {
        skill: `${siteUrl}/.well-known/agent-skills/site-navigation.md`,
        register_uri: `${siteUrl}/auth.md`,
        identity_types_supported: ['anonymous'],
        anonymous: {
          credential_types_supported: ['none'],
          claim_uri: `${siteUrl}/auth.md#anonymous`,
        },
      },
    },
    null,
    2
  );
}

function buildJwks() {
  return JSON.stringify({ keys: [] }, null, 2);
}

function buildMcpServerCard() {
  return JSON.stringify(
    {
      serverInfo: {
        name: 'dytsou-personal-site',
        version: siteVersion,
      },
      endpoint: siteUrl,
      transport: {
        type: 'webmcp',
      },
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {},
        prompts: {},
      },
      tools: [
        { name: 'navigate_to_page' },
        { name: 'get_contact_info' },
        { name: 'list_projects' },
        { name: 'list_site_pages' },
      ],
    },
    null,
    2
  );
}

async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, 'utf8');
}

async function main() {
  const skillEntries = [];

  for (const skill of agentSkills) {
    const skillPath = path.join(
      publicDir,
      '.well-known/agent-skills',
      `${skill.name}.md`
    );
    await writeText(skillPath, skill.content);
    skillEntries.push({
      name: skill.name,
      type: skill.type,
      description: skill.description,
      url: `${siteUrl}/.well-known/agent-skills/${skill.name}.md`,
      digest: sha256(skill.content),
    });
  }

  const skillsIndex = {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: skillEntries,
  };

  const markdownDir = path.join(publicDir, '.well-known/markdown');
  for (const [routePath, markdown] of Object.entries(pageMarkdown)) {
    const fileName = routePath === '/' ? 'index.md' : `${routePath.slice(1)}.md`;
    await writeText(path.join(markdownDir, fileName), markdown);
  }

  await writeText(path.join(publicDir, 'sitemap.xml'), buildSitemap());
  await writeText(path.join(publicDir, 'robots.txt'), buildRobotsTxt());
  await writeText(path.join(publicDir, 'auth.md'), buildAuthMd());
  await writeText(
    path.join(publicDir, '.well-known/api-catalog'),
    buildApiCatalog()
  );
  await writeText(
    path.join(publicDir, '.well-known/oauth-protected-resource'),
    buildOAuthProtectedResource()
  );
  await writeText(
    path.join(publicDir, '.well-known/oauth-authorization-server'),
    buildOAuthAuthorizationServer()
  );
  await writeText(path.join(publicDir, '.well-known/jwks.json'), buildJwks());
  await writeText(
    path.join(publicDir, '.well-known/mcp/server-card.json'),
    buildMcpServerCard()
  );
  await writeText(
    path.join(publicDir, '.well-known/agent-skills/index.json'),
    `${JSON.stringify(skillsIndex, null, 2)}\n`
  );

  console.log('✓ Generated agent discovery files in public/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
