import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import * as build from './verify-build.mjs';

const routes = [{ path: '/' }, { path: '/projects' }];
const privateHtml =
  '<meta name="robots" content="noindex, nofollow"><main>Private report</main>';

async function fixture(t) {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'heatmap-build-'));
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  const put = async (file, content) => {
    await mkdir(path.dirname(path.join(outputDir, file)), { recursive: true });
    await writeFile(path.join(outputDir, file), content);
  };
  await put('insights/index.html', privateHtml);
  await put('index.html', '<nav><a href="/projects/">Projects</a></nav>');
  await put('projects/index.html', '<a href="/">Home</a>');
  await put('sitemap.xml', '<loc>https://dy.tsou.me/projects/</loc>');
  await put('llms.txt', '[Projects](/projects/)');
  await put('.well-known/api-catalog', '{"apis":[]}');
  return {
    put,
    outputDir,
    verify: (options = {}) =>
      build.verifyHeatmapBuild({ outputDir, routes, ...options }),
  };
}

test('private artifact exists and is noindex while public routes remain discoverable', async (t) => {
  assert.equal(typeof build.verifyHeatmapBuild, 'function');
  const f = await fixture(t);
  await f.verify();
  await f.put(
    'insights/index.html',
    "<meta content='nofollow, noindex' name='robots'>"
  );
  await f.verify();
});

test('missing private HTML or missing noindex fails the build check', async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.outputDir, 'insights/index.html'));
  await assert.rejects(f.verify(), /Missing private heatmap artifact/);
  await f.put('insights/index.html', '<meta name="robots" content="index">');
  await assert.rejects(f.verify(), /noindex/);
});

test('quoted attributes preserve delimiters and reject misleading robots text', async (t) => {
  const f = await fixture(t);
  await f.put(
    'insights/index.html',
    `<meta title="name='robots' content='noindex'" name="robots" content="index">`
  );
  await assert.rejects(f.verify(), /noindex/);
  await f.put(
    'insights/index.html',
    `<meta ${'x'.repeat(100_000)} name='ROBOTS' content='NOINDEX, nofollow'>`
  );
  await f.verify();
  await f.put(
    'index.html',
    `<a title="owner's report" HREF='/insights/'>Report</a>`
  );
  await assert.rejects(f.verify(), /public HTML/);
});

test('public route manifest and public HTML navigation cannot advertise private paths', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    f.verify({ routes: [...routes, { path: '/insights' }] }),
    /public route manifest/
  );
  for (const href of [
    '/insights/',
    'https://dy.tsou.me/insights',
    '/api/insights/report',
  ]) {
    await f.put('index.html', `<nav><a href="${href}">Report</a></nav>`);
    await assert.rejects(f.verify(), /public HTML/);
  }
});

test('sitemap, agent discovery, and public text discovery cannot include private report endpoints', async (t) => {
  const f = await fixture(t);
  for (const file of [
    'sitemap.xml',
    'llms.txt',
    'llms-full.txt',
    '.well-known/api-catalog',
    'site-routes.json',
    'auth.md',
  ]) {
    await f.put(file, 'https://dy.tsou.me/insights/');
    await assert.rejects(f.verify(), /public discovery/);
    await f.put(file, 'https://dy.tsou.me/projects/');
  }
});

test('static HTML and bundles cannot contain secret names or configured token values', async (t) => {
  const f = await fixture(t);
  for (const secret of [
    'HEATMAP_READ_TOKEN',
    'HEATMAP_WEB_ANALYTICS_TOKEN',
    'private-fixture-token',
  ]) {
    await f.put('_astro/report.js', `const token = '${secret}';`);
    await assert.rejects(
      f.verify({ env: { HEATMAP_READ_TOKEN: 'private-fixture-token' } }),
      /Secret/
    );
  }
  await f.put('_astro/report.js', 'const previewPath = "/insights/";');
  await f.verify();
});

test('production and preview click datasets are explicitly separate with preview collection disabled', async () => {
  const config = await readFile(
    new URL('../wrangler.toml', import.meta.url),
    'utf8'
  );
  const [production, preview] = config.split('[env.preview.vars]');
  assert.match(production, /HEATMAP_DATASET = "site_click_events"/);
  assert.ok(preview, 'preview non-inheritable keys must be explicit');
  assert.match(preview, /HEATMAP_PUBLIC_ORIGINS = '\[\]'/);
  assert.match(preview, /HEATMAP_DATASET = "site_click_events_preview"/);
  assert.match(
    preview,
    /\[\[env.preview.analytics_engine_datasets\]\][\s\S]*binding = "CLICK_EVENTS"[\s\S]*dataset = "site_click_events_preview"/
  );
  assert.match(preview, /\[env.preview.ai\][\s\S]*binding = "AI"/);
  assert.match(
    preview,
    /\[\[env.preview.d1_databases\]\][\s\S]*binding = "GITHUB_ACTIVITY_DB"/
  );
});

test('aggregate script includes every heatmap suite and Functions compile is wired into release checks', async () => {
  const pkg = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  );
  for (const suite of [
    'contract',
    'collector',
    'ingestion',
    'access',
    'report',
    'preview',
    'build',
  ]) {
    assert.ok(
      pkg.scripts['test:heatmap']?.includes(
        `scripts/heatmap-${suite}.test.mjs`
      ),
      `missing ${suite} suite`
    );
  }
  assert.ok(
    pkg.scripts['test:heatmap'].includes(
      'workers/front-door/tests/ingestion.test.mjs'
    )
  );
  assert.match(
    pkg.scripts['verify:functions'],
    /wrangler pages functions build/
  );
  for (const workflow of ['ci.yml', 'deploy.yml']) {
    const source = await readFile(
      new URL(`../.github/workflows/${workflow}`, import.meta.url),
      'utf8'
    );
    assert.match(source, /run: pnpm test:heatmap/);
    assert.match(source, /run: pnpm verify:functions/);
  }
});

test('Pages deploy installs source dependencies before packaging JOSE-dependent Functions', async () => {
  const source = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  );
  const deploy = source.slice(source.indexOf('\n  deploy:'));
  const install = deploy.indexOf('run: pnpm install --frozen-lockfile');
  assert.ok(install >= 0);
  assert.ok(
    install < deploy.indexOf('uses: dytsou/cloudflare-subpath-deploy@')
  );
  assert.ok(deploy.includes('node-version: 24'));
  assert.ok(deploy.includes('uses: pnpm/action-setup@'));
});
