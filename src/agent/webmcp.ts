import { SITE_ROUTES, SITE_URL } from '../constants/site';
import { CONTACT_CARDS } from '../components/contact/ContactLinks';
import { PROJECTS_CONTENTS } from '../components/contents/Projects.generated';

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal }
  ) => Promise<void>;
};

type ModelContextHost = {
  modelContext?: ModelContext;
};

const PAGE_PATHS = SITE_ROUTES.map((route) => route.path);

let navigateToPage: (path: string) => void = (path) => {
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  window.location.assign(url);
};

let toolsRegistered = false;

function getModelContext(): ModelContext | undefined {
  return (
    (document as ModelContextHost).modelContext ??
    (navigator as ModelContextHost).modelContext
  );
}

export function setWebMcpNavigate(navigate: (path: string) => void) {
  navigateToPage = navigate;
}

export function registerWebMcpTools(signal?: AbortSignal): boolean {
  const modelContext = getModelContext();
  if (!modelContext || toolsRegistered) return toolsRegistered;
  toolsRegistered = true;

  const options = signal ? { signal } : undefined;

  void modelContext.registerTool(
    {
      name: 'navigate_to_page',
      description: 'Navigate to a page on Dong-You Tsou personal site.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: PAGE_PATHS,
            description: 'Canonical site path such as /about or /projects.',
          },
        },
        required: ['page'],
      },
      execute: async (input) => {
        const page = String(input.page ?? '/');
        if (!PAGE_PATHS.includes(page as (typeof PAGE_PATHS)[number])) {
          throw new Error(`Unknown page: ${page}`);
        }
        navigateToPage(page);
        return { url: `${SITE_URL}${page === '/' ? '' : page}` };
      },
    },
    options
  );

  void modelContext.registerTool(
    {
      name: 'get_contact_info',
      description: 'Return public contact channels for Dong-You Tsou.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async () => ({
        contacts: CONTACT_CARDS.map(({ platform, title, subtitle, url }) => ({
          platform,
          title,
          subtitle,
          url,
        })),
        calendar: `${SITE_URL}/cal`,
        resume: `${SITE_URL}/resume`,
      }),
    },
    options
  );

  void modelContext.registerTool(
    {
      name: 'list_projects',
      description: 'List featured projects from the site portfolio.',
      inputSchema: {
        type: 'object',
        properties: {
          featuredOnly: {
            type: 'boolean',
            description: 'When true, return only featured projects.',
          },
        },
      },
      execute: async (input) => {
        const featuredOnly = Boolean(input.featuredOnly);
        const projects = featuredOnly
          ? PROJECTS_CONTENTS.filter((project) => project.featured)
          : PROJECTS_CONTENTS;

        return {
          projects: projects.map(
            ({ title, description, technologies, github_url, featured }) => ({
              title,
              description,
              technologies,
              github_url,
              featured,
            })
          ),
        };
      },
    },
    options
  );

  void modelContext.registerTool(
    {
      name: 'list_site_pages',
      description: 'Return canonical URLs for all public site pages.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      execute: async () => ({
        pages: SITE_ROUTES.map(({ path }) => ({
          path,
          url: `${SITE_URL}${path === '/' ? '' : path}`,
        })),
        discovery: {
          apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
          agentSkills: `${SITE_URL}/.well-known/agent-skills/index.json`,
          sitemap: `${SITE_URL}/sitemap.xml`,
          auth: `${SITE_URL}/auth.md`,
          oauthProtectedResource: `${SITE_URL}/.well-known/oauth-protected-resource`,
          oauthAuthorizationServer: `${SITE_URL}/.well-known/oauth-authorization-server`,
        },
      }),
    },
    options
  );

  return true;
}
