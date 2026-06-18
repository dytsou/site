export interface Env {
  ORIGIN_BASE: string;
}

const SPA_ROUTES = new Set([
  '/',
  '/about',
  '/experiences',
  '/projects',
  '/contact',
]);

const ROUTE_MARKDOWN: Record<string, string> = {
  '/': '/.well-known/markdown/index.md',
  '/about': '/.well-known/markdown/about.md',
  '/experiences': '/.well-known/markdown/experiences.md',
  '/projects': '/.well-known/markdown/projects.md',
  '/contact': '/.well-known/markdown/contact.md',
};

const WELL_KNOWN_CONTENT_TYPES: Record<string, string> = {
  '/.well-known/api-catalog': 'application/linkset+json; charset=utf-8',
  '/.well-known/agent-skills/index.json': 'application/json; charset=utf-8',
  '/.well-known/oauth-protected-resource':
    'application/oauth-protected-resource+json; charset=utf-8',
  '/.well-known/oauth-authorization-server':
    'application/oauth-authorization-server+json; charset=utf-8',
  '/.well-known/jwks.json': 'application/json; charset=utf-8',
  '/.well-known/mcp/server-card.json': 'application/json; charset=utf-8',
};

const HOMEPAGE_LINK_HEADERS = [
  `</.well-known/api-catalog>; rel="api-catalog"`,
  `</.well-known/agent-skills/index.json>; rel="describedby"`,
  `</.well-known/mcp/server-card.json>; rel="describedby"`,
  `</auth.md>; rel="service-doc"; type="text/markdown"`,
  `</sitemap.xml>; rel="sitemap"; type="application/xml"`,
].join(', ');

function acceptsMarkdown(request: Request): boolean {
  const accept = request.headers.get('Accept') ?? '';
  return accept.includes('text/markdown');
}

function estimateMarkdownTokens(markdown: string): string {
  return String(Math.ceil(markdown.length / 4));
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function originPath(pathname: string): string {
  if (pathname === '/') return 'index.html';
  if (SPA_ROUTES.has(pathname)) return '404.html';
  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
}

async function fetchOrigin(
  env: Env,
  pathname: string,
  request: Request
): Promise<Response> {
  const originUrl = new URL(originPath(pathname), env.ORIGIN_BASE);
  return fetch(originUrl.toString(), {
    method: request.method,
    headers: {
      'User-Agent': request.headers.get('User-Agent') ?? 'dytsou-site-edge',
    },
    redirect: 'follow',
  });
}

async function fetchOriginAsset(env: Env, pathname: string): Promise<Response> {
  const assetPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const originUrl = new URL(assetPath, env.ORIGIN_BASE);
  return fetch(originUrl.toString(), { redirect: 'follow' });
}

async function serveMarkdown(
  env: Env,
  pathname: string
): Promise<Response | null> {
  const markdownPath = ROUTE_MARKDOWN[pathname];
  if (!markdownPath) return null;

  const originResponse = await fetchOriginAsset(env, markdownPath);
  if (!originResponse.ok) return null;

  const markdown = await originResponse.text();
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'x-markdown-tokens': estimateMarkdownTokens(markdown),
    Vary: 'Accept',
  });

  return new Response(markdown, { status: 200, headers });
}

function applyWellKnownContentType(pathname: string, headers: Headers) {
  const contentType = WELL_KNOWN_CONTENT_TYPES[pathname];
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
}

function applyHtmlContentType(pathname: string, headers: Headers) {
  if (pathname === '/' || SPA_ROUTES.has(pathname)) {
    headers.set('Content-Type', 'text/html; charset=utf-8');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fetchOrigin(env, pathname, request);
    }

    if (acceptsMarkdown(request)) {
      const markdownResponse = await serveMarkdown(env, pathname);
      if (markdownResponse) {
        if (request.method === 'HEAD') {
          return new Response(null, {
            status: markdownResponse.status,
            headers: markdownResponse.headers,
          });
        }
        return markdownResponse;
      }
    }

    const originResponse = await fetchOrigin(env, pathname, request);
    const headers = new Headers(originResponse.headers);
    applyWellKnownContentType(pathname, headers);
    applyHtmlContentType(pathname, headers);

    const status =
      SPA_ROUTES.has(pathname) && pathname !== '/'
        ? 404
        : originResponse.status;

    if (pathname === '/') {
      headers.set('Link', HOMEPAGE_LINK_HEADERS);
    }

    if (request.method === 'HEAD') {
      return new Response(null, {
        status,
        headers,
      });
    }

    return new Response(originResponse.body, {
      status,
      headers,
    });
  },
};
