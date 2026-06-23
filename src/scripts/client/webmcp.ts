import { PROJECTS_CONTENTS } from '../../components/contents/Projects.generated';
import { education, experiences } from '../../data/experience-content';
import { FOOTER_SOCIAL_LINKS } from '../../data/footer-links';
import {
  NAV_LINKS,
  SITE_NAME,
  SITE_ROUTES,
  SITE_URL,
} from '../../data/site-routes';

type Theme = 'light' | 'dark';

type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal }
  ) => Promise<void>;
  provideContext?: (context: { tools: ModelContextTool[] }) => Promise<void>;
};

const SITE_PATHS = SITE_ROUTES.map((route) =>
  route.path === '/' ? '/' : `${route.path}/`
);

function getModelContext(): ModelContext | undefined {
  const doc = document as Document & { modelContext?: ModelContext };
  const nav = navigator as Navigator & { modelContext?: ModelContext };
  return doc.modelContext ?? nav.modelContext;
}

function readTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  localStorage.setItem('theme', theme);
}

function normalizePath(path: string): string | null {
  const trimmed = path.trim();
  if (trimmed === '/') return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeading.endsWith('/')
    ? withLeading
    : `${withLeading}/`;
  return SITE_PATHS.includes(normalized) ? normalized : null;
}

function searchProjects(query: string, featuredOnly = false) {
  const needle = query.trim().toLowerCase();
  return PROJECTS_CONTENTS.filter((project) => {
    if (featuredOnly && !project.featured) return false;
    if (!needle) return true;
    const haystack = [
      project.title,
      project.description,
      ...project.technologies,
      ...project.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  }).map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    technologies: project.technologies,
    tags: project.tags,
    github_url: project.github_url,
    featured: project.featured,
  }));
}

const tools: ModelContextTool[] = [
  {
    name: 'navigate',
    title: 'Navigate',
    description:
      'Navigate to a page on dy.tsou.me. Valid paths: /, /about/, /experiences/, /projects/, /contact/.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Site path to open, e.g. /projects/',
        },
      },
      required: ['path'],
    },
    execute: async (input) => {
      const path = normalizePath(
        typeof input.path === 'string' ? input.path : ''
      );
      if (!path) {
        throw new Error(`Invalid path. Use one of: ${SITE_PATHS.join(', ')}`);
      }
      globalThis.location.assign(path);
      return { navigatedTo: path };
    },
  },
  {
    name: 'get_site_info',
    title: 'Site info',
    description:
      'Get metadata about Dong-You Tsou personal site, including available pages and external links.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => ({
      name: SITE_NAME,
      url: SITE_URL,
      description:
        'Personal portfolio for Dong-You Tsou, a full-stack developer and NYCU CS student.',
      pages: SITE_PATHS,
      navigation: NAV_LINKS,
    }),
  },
  {
    name: 'search_projects',
    title: 'Search projects',
    description:
      'Search portfolio projects by title, description, technology, or tag.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search text. Leave empty to list all matching projects.',
        },
        featuredOnly: {
          type: 'boolean',
          description: 'When true, return only featured projects.',
        },
      },
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      const query = typeof input.query === 'string' ? input.query : '';
      const featuredOnly = input.featuredOnly === true;
      const results = searchProjects(query, featuredOnly);
      return { count: results.length, projects: results };
    },
  },
  {
    name: 'get_experiences',
    title: 'Experiences',
    description:
      'Get work, leadership, research experience entries and education details.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => ({ experiences, education }),
  },
  {
    name: 'get_contact_info',
    title: 'Contact info',
    description: 'Get contact links for email, GitHub, LinkedIn, and Telegram.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => ({
      email: 'contact@dy.tsou.me',
      social: FOOTER_SOCIAL_LINKS,
      resume: 'https://dy.tsou.me/resume',
      calendar: 'https://dy.tsou.me/cal',
    }),
  },
  {
    name: 'get_theme',
    title: 'Get theme',
    description: 'Get the current color theme for the site.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => ({ theme: readTheme() }),
  },
  {
    name: 'set_theme',
    title: 'Set theme',
    description: 'Switch the site between light and dark color themes.',
    inputSchema: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['light', 'dark'],
          description: 'Theme to apply.',
        },
      },
      required: ['theme'],
    },
    execute: async (input) => {
      const theme = input.theme === 'dark' ? 'dark' : 'light';
      applyTheme(theme);
      return { theme };
    },
  },
];

async function registerTools(modelContext: ModelContext, signal: AbortSignal) {
  if ('registerTool' in modelContext) {
    await Promise.all(
      tools.map((tool) => modelContext.registerTool(tool, { signal }))
    );
    return;
  }

  if (modelContext.provideContext) {
    await modelContext.provideContext({ tools });
  }
}

function initWebMcp() {
  const modelContext = getModelContext();
  if (!modelContext) return;

  const controller = new AbortController();
  window.addEventListener('pagehide', () => controller.abort(), {
    once: true,
  });

  void registerTools(modelContext, controller.signal).catch((error) => {
    console.error('WebMCP tool registration failed:', error);
  });
}

initWebMcp();

// ponytail: self-check — fails fast if tool wiring breaks at build/runtime
if (import.meta.env.DEV) {
  const names = new Set(tools.map((tool) => tool.name));
  console.assert(
    names.size === tools.length,
    'WebMCP tool names must be unique'
  );
  console.assert(
    normalizePath('/projects') === '/projects/',
    'WebMCP path normalization'
  );
}
