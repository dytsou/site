import {
  wantsMarkdown,
  isHtmlPagePath,
  negotiateMarkdown,
} from '../shared/markdown-negotiation.mjs';

export async function onRequest(context) {
  if (!wantsMarkdown(context.request)) {
    return context.next();
  }

  const { pathname } = new URL(context.request.url);
  if (!isHtmlPagePath(pathname)) {
    return context.next();
  }

  const response = await context.next();
  return negotiateMarkdown(context.request, response, context.env);
}
