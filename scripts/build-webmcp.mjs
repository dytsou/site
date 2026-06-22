import * as esbuild from 'esbuild';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

try {
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'src/webmcp-bootstrap.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'WebMcpBootstrap',
    outfile: path.join(repoRoot, 'public/webmcp-bootstrap.js'),
    platform: 'browser',
    target: 'es2020',
    logLevel: 'info',
  });
  console.log('✓ Built public/webmcp-bootstrap.js');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
