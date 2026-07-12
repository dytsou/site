#!/usr/bin/env node
import process from 'node:process';

const siteUrls = [
  process.env.SITE_URL,
  process.env.FRONT_DOOR_URL,
  process.env.PAGES_URL,
  'https://dy.tsou.me/',
  'https://dy-tsou-me.pages.dev/',
].filter(Boolean);

let lastError;

for (const siteUrl of new Set(siteUrls)) {
  try {
    const res = await fetch(siteUrl, {
      headers: { Accept: 'text/markdown' },
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/markdown')) {
      throw new Error(`Expected Content-Type text/markdown for ${siteUrl}`);
    }

    const body = await res.text();
    if (!body.trim()) {
      throw new Error(`Markdown response body was empty for ${siteUrl}`);
    }

    console.log(`✓ markdown negotiation OK (${siteUrl})`);
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}

throw (
  lastError ?? new Error('No site URLs configured for markdown verification')
);
