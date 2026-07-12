#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  buildTarget,
  matchRoute,
  matchesPrefix,
} from '../workers/front-door/src/routing.js';

const siteManifest = [
  {
    pathPrefix: '/',
    backend: 'https://dy-tsou-me.pages.dev',
    stripPrefix: '',
    ownerRepo: 'dytsou/site',
    kind: 'site',
  },
  {
    pathPrefix: '/cal/',
    backend: 'https://cal.tsou.me',
    stripPrefix: '/cal',
    ownerRepo: 'dytsou/cal',
    kind: 'page',
  },
];

assert.equal(matchesPrefix('/about/', '/'), true);
assert.equal(matchesPrefix('/cal/', '/cal/'), true);
assert.equal(matchesPrefix('/cal', '/cal/'), true);
assert.equal(matchesPrefix('/calendar/', '/cal/'), false);

const calRoute = matchRoute('/cal/asset/favicon.png', siteManifest);
assert.equal(calRoute?.pathPrefix, '/cal/');
assert.equal(
  buildTarget('https://dy.tsou.me/cal/asset/favicon.png', calRoute),
  'https://cal.tsou.me/asset/favicon.png'
);

const rootRoute = matchRoute('/about/', siteManifest);
assert.equal(rootRoute?.pathPrefix, '/');
assert.equal(
  buildTarget('https://dy.tsou.me/about/', rootRoute),
  'https://dy-tsou-me.pages.dev/about/'
);

console.log('✓ verify-front-door-routing passed');
