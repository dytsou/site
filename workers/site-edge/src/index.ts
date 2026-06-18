export interface Env {
  ORIGIN_HOST: string;
}

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
};

function applyWellKnownContentType(pathname: string, headers: Headers) {
  const contentType = WELL_KNOWN_CONTENT_TYPES[pathname];
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
}

const HOMEPAGE_LINK_HEADERS = [
  `</.well-known/api-catalog>; rel="api-catalog"`,
  `</.well-known/agent-skills/index.json>; rel="describedby"`,
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

async function fetchOrigin(
  request: Request,
  env: Env,
  pathname: string
): Promise<Response> {
  const originUrl = new URL(pathname, `https://${env.ORIGIN_HOST}`);
  const originRequest = new Request(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  });
  return fetch(originRequest);
}

async function serveMarkdown(
  request: Request,
  env: Env,
  pathname: string
): Promise<Response | null> {
  const markdownPath = ROUTE_MARKDOWN[pathname];
  if (!markdownPath) return null;

  const originResponse = await fetchOrigin(request, env, markdownPath);
  if (!originResponse.ok) return null;

  const markdown = await originResponse.text();
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'x-markdown-tokens': estimateMarkdownTokens(markdown),
    Vary: 'Accept',
  });

  return new Response(markdown, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fetchOrigin(request, env, `${pathname}${url.search}`);
    }

    if (acceptsMarkdown(request)) {
      const markdownResponse = await serveMarkdown(request, env, pathname);
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

    const originResponse = await fetchOrigin(
      request,
      env,
      `${pathname}${url.search}`
    );
    const headers = new Headers(originResponse.headers);
    applyWellKnownContentType(pathname, headers);

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
