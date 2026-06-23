const MAX_HTML_BYTES = 2_097_152;

function wantsMarkdown(request) {
  return (request.headers.get('Accept') ?? '').includes('text/markdown');
}

function isHtmlPagePath(pathname) {
  if (pathname === '/auth.md') return false;
  if (pathname.startsWith('/.well-known/')) return false;
  if (pathname.endsWith('/')) return true;
  return /\.html?$/i.test(pathname);
}

export async function onRequest(context) {
  if (!wantsMarkdown(context.request)) {
    return context.next();
  }

  const { pathname } = new URL(context.request.url);
  if (!isHtmlPagePath(pathname)) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  if (html.length > MAX_HTML_BYTES) {
    return new Response('HTML response exceeds markdown conversion limit', {
      status: 413,
    });
  }

  const origin = new URL(context.request.url).origin;
  const result = await context.env.AI.toMarkdown(
    {
      name: 'page.html',
      blob: new Blob([html], { type: 'text/html' }),
    },
    {
      conversionOptions: {
        html: { resolveLinks: origin },
      },
    }
  );
  const doc = Array.isArray(result) ? result[0] : result;

  const markdown = doc?.data ?? '';
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    Vary: 'accept',
    'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
  });

  const tokens =
    doc?.tokens && doc.tokens > 0
      ? doc.tokens
      : Math.ceil(new TextEncoder().encode(markdown).length / 4);
  headers.set('x-markdown-tokens', String(tokens));

  return new Response(markdown, { status: response.status, headers });
}
