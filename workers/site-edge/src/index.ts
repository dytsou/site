import siteRoutesJson from '../../../src/data/site-routes.json';

export interface Env {
  ORIGIN_BASE: string;
}

type SiteRoute = { path: string };

const SITE_ROUTES = new Set(
  (siteRoutesJson as SiteRoute[]).map((route) => route.path)
);

const ROUTE_MARKDOWN: Record<string, string> = Object.fromEntries(
  (siteRoutesJson as SiteRoute[]).map((route) => [
    route.path,
    route.path === '/'
      ? '/.well-known/markdown/index.md'
      : `/.well-known/markdown/${route.path.slice(1)}.md`,
  ])
);

const STATIC_CONTENT_TYPES: Record<string, string> = {
  '/auth.md': 'text/markdown; charset=utf-8',
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

function isAllowedPath(pathname: string): boolean {
  if (pathname.includes('..')) return false;
  if (pathname === '/') return true;
  if (SITE_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (pathname === '/webmcp-bootstrap.js') return true;
  if (pathname.startsWith('/.well-known/')) return true;
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') return true;
  if (pathname === '/auth.md') return true;
  return false;
}

function originPath(pathname: string): string {
  if (pathname === '/') return 'index.html';
  if (SITE_ROUTES.has(pathname)) return `${pathname.slice(1)}/index.html`;
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

function applyDiscoveryContentType(pathname: string, headers: Headers) {
  const contentType =
    STATIC_CONTENT_TYPES[pathname] ?? WELL_KNOWN_CONTENT_TYPES[pathname];
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
}

function applyHtmlContentType(pathname: string, headers: Headers) {
  if (pathname === '/' || SITE_ROUTES.has(pathname)) {
    headers.set('Content-Type', 'text/html; charset=utf-8');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (!isAllowedPath(pathname)) {
      return new Response('Not Found', { status: 404 });
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
    if (!originResponse.ok) {
      console.log({
        event: 'origin_fetch_error',
        pathname,
        method: request.method,
        status: originResponse.status,
      });
    }
    const headers = new Headers(originResponse.headers);
    applyDiscoveryContentType(pathname, headers);
    applyHtmlContentType(pathname, headers);

    if (pathname === '/') {
      headers.set('Link', HOMEPAGE_LINK_HEADERS);
    }

    if (request.method === 'HEAD') {
      return new Response(null, {
        status: originResponse.status,
        headers,
      });
    }

    return new Response(originResponse.body, {
      status: originResponse.status,
      headers,
    });
  },
};
