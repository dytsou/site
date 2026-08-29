import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const packageJsonPath = resolve(rootDir, 'package.json');
const serverCardPath = resolve(
  rootDir,
  'public/.well-known/mcp/server-card.json'
);

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const serverCard = JSON.parse(readFileSync(serverCardPath, 'utf8'));

const newVersion = packageJson.version;

if (serverCard.serverInfo.version !== newVersion) {
  serverCard.serverInfo.version = newVersion;
  writeFileSync(serverCardPath, JSON.stringify(serverCard, null, 2) + '\n');
  console.log(`Updated server-card.json version to ${newVersion}`);
} else {
  console.log(`Version already in sync: ${newVersion}`);
}
