#!/usr/bin/env node
import process from 'node:process';

const siteUrls = [
  process.env.SITE_URL,
  process.env.FRONT_DOOR_URL,
  process.env.PAGES_URL,
  'https://dy.tsou.me/',
  'https://dy-tsou-me.pages.dev/',
].filter(Boolean);

function verifyMarkdownNegotiation(siteUrl) {
  return fetch(siteUrl, {
    headers: { Accept: 'text/markdown' },
  })
    .then((res) => {
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/markdown')) {
        throw new Error(`Expected Content-Type text/markdown for ${siteUrl}`);
      }
      return res.text();
    })
    .then((body) => {
      if (!body.trim()) {
        throw new Error(`Markdown response body was empty for ${siteUrl}`);
      }
      console.log(`✓ markdown negotiation OK (${siteUrl})`);
    });
}

const [firstSiteUrl, ...fallbackSiteUrls] = [...new Set(siteUrls)];
if (!firstSiteUrl) {
  throw new Error('No site URLs configured for markdown verification');
}

await fallbackSiteUrls.reduce(
  (previous, siteUrl) =>
    previous.catch(() => verifyMarkdownNegotiation(siteUrl)),
  verifyMarkdownNegotiation(firstSiteUrl)
);
