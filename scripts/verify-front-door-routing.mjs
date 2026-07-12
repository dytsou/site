#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildTarget,
  matchRoute,
  matchesPrefix,
} from '../workers/front-door/src/routing.js';

const manifest = JSON.parse(
  await readFile('src/data/route-manifest.json', 'utf8')
);

assert.equal(matchesPrefix('/about/', '/'), true);
assert.equal(matchesPrefix('/cal/', '/cal/'), true);
assert.equal(matchesPrefix('/cal', '/cal/'), true);
assert.equal(matchesPrefix('/calendar/', '/cal/'), false);
assert.equal(matchesPrefix('/resume/', '/resume/'), true);

const calRoute = matchRoute('/cal/asset/favicon.png', manifest);
assert.equal(calRoute?.pathPrefix, '/cal/');
assert.equal(
  buildTarget('https://dy.tsou.me/cal/asset/favicon.png', calRoute),
  'https://cal.tsou.me/asset/favicon.png'
);

const resumeRoute = matchRoute('/resume/', manifest);
assert.equal(resumeRoute?.pathPrefix, '/resume/');
assert.equal(
  buildTarget('https://dy.tsou.me/resume/', resumeRoute),
  'https://resume.tsou.me/'
);

const rootRoute = matchRoute('/about/', manifest);
assert.equal(rootRoute?.pathPrefix, '/');
assert.equal(
  buildTarget('https://dy.tsou.me/about/', rootRoute),
  'https://dy-tsou-me.pages.dev/about/'
);

console.log('✓ verify-front-door-routing passed');
