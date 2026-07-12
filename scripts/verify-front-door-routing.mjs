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

// Assert routing logic against whatever backend the manifest currently
// points at, so the test survives backend cutovers (e.g. cal.tsou.me ->
// dy-tsou-cal.pages.dev) without edits.
const calRoute = matchRoute('/cal/asset/favicon.png', manifest);
assert.equal(calRoute?.pathPrefix, '/cal/');
assert.equal(
  buildTarget('https://dy.tsou.me/cal/asset/favicon.png', calRoute),
  `${calRoute.backend}/asset/favicon.png`
);

const resumeRoute = matchRoute('/resume/', manifest);
assert.equal(resumeRoute?.pathPrefix, '/resume/');
assert.equal(
  buildTarget('https://dy.tsou.me/resume/', resumeRoute),
  `${resumeRoute.backend}/`
);

const rootRoute = matchRoute('/about/', manifest);
assert.equal(rootRoute?.pathPrefix, '/');
assert.equal(
  buildTarget('https://dy.tsou.me/about/', rootRoute),
  `${rootRoute.backend}/about/`
);

console.log('✓ verify-front-door-routing passed');
