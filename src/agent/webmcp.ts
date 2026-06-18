import { SITE_ROUTES, SITE_URL } from '../constants/site';
import { CONTACT_CARDS } from '../components/contact/ContactLinks';
import { PROJECTS_CONTENTS } from '../components/contents/Projects.generated';

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
  annotations?: { readOnlyHint?: boolean };
};

type ModelContext = {
  registerTool: (
    tool: WebMcpTool,
    options?: { signal?: AbortSignal }
  ) => Promise<void>;
};

type ModelContextHost = {
  modelContext?: ModelContext;
};

const PAGE_PATHS = SITE_ROUTES.map((route) => route.path);

let navigateToPage: (path: string) => void = (path) => {
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  globalThis.location.assign(url);
};

let toolsRegistered = false;

export function hasWebMcpModelContext(): boolean {
  return typeof getModelContext()?.registerTool === 'function';
}

function getModelContext(): ModelContext | undefined {
  const navigatorContext = (navigator as ModelContextHost).modelContext;
  if (typeof navigatorContext?.registerTool === 'function') {
    return navigatorContext;
  }

  const documentContext = (document as ModelContextHost).modelContext;
  if (typeof documentContext?.registerTool === 'function') {
    return documentContext;
  }

  return undefined;
}

export function setWebMcpNavigate(navigate: (path: string) => void) {
  navigateToPage = navigate;
}

function buildWebMcpTools(): WebMcpTool[] {
  return [
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
      annotations: { readOnlyHint: true },
    },
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
      annotations: { readOnlyHint: true },
    },
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
      annotations: { readOnlyHint: true },
    },
  ];
}

export async function registerWebMcpTools(
  signal?: AbortSignal
): Promise<boolean> {
  if (toolsRegistered) return true;

  const modelContext = getModelContext();
  if (!modelContext) return false;

  const options = signal ? { signal } : undefined;

  try {
    for (const tool of buildWebMcpTools()) {
      await modelContext.registerTool(tool, options);
    }
    toolsRegistered = true;
    return true;
  } catch (error) {
    if (signal?.aborted) return false;
    console.warn('WebMCP tool registration failed:', error);
    return false;
  }
}

const POLL_MS = 100;
const REGISTRATION_TIMEOUT_MS = 30_000;

export function waitAndRegisterWebMcpTools(signal?: AbortSignal): void {
  const deadline = Date.now() + REGISTRATION_TIMEOUT_MS;

  const attempt = async () => {
    if (signal?.aborted) return;
    if (await registerWebMcpTools(signal)) return;
    if (Date.now() >= deadline) return;
    setTimeout(attempt, POLL_MS);
  };

  void attempt();
}
