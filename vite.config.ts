import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Extract HTML tags from index.html content
 */
const extractTagsFromIndex = (indexContent: string) => {
  // Extract script and link tags that Vite injects (for JS and CSS)
  const scriptMatch = indexContent.match(
    /<script[^>]*src="[^"]*"[^>]*><\/script>/
  );
  const linkMatch = indexContent.match(/<link[^>]*rel="stylesheet"[^>]*>/);

  const scriptTag = scriptMatch ? scriptMatch[0] : '';
  const linkTag = linkMatch ? linkMatch[0] : '';

  // Extract favicon path if exists
  const faviconMatch = indexContent.match(
    /<link[^>]*rel="(?:icon|shortcut icon)"[^>]*href="([^"]*)"[^>]*>/
  );
  const faviconLink = faviconMatch
    ? `<link rel="icon" type="image/png" href="${faviconMatch[1]}" />`
    : '';

  return { scriptTag, linkTag, faviconLink };
};

/**
 * Generate minimal 404.html template for GitHub Pages SPA routing
 */
const createMinimal404Html = (
  faviconLink: string,
  linkTag: string,
  scriptTag: string
): string => {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${faviconLink}
  <title>Dong-You Tsou</title>
  ${linkTag}
</head>
<body>
  <div id="root"></div>
  ${scriptTag}
</body>
</html>`;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'github-pages-spa',
      writeBundle() {
        const distPath = join(process.cwd(), 'dist');
        const indexPath = join(distPath, 'index.html');
        const notFoundPath = join(distPath, '404.html');
        const noJekyllPath = join(distPath, '.nojekyll');

        // Create minimal 404.html for GitHub Pages SPA routing
        if (existsSync(indexPath)) {
          const indexContent = readFileSync(indexPath, 'utf-8');
          const { scriptTag, linkTag, faviconLink } =
            extractTagsFromIndex(indexContent);
          const minimal404 = createMinimal404Html(
            faviconLink,
            linkTag,
            scriptTag
          );

          writeFileSync(notFoundPath, minimal404);
          console.log(
            '✓ Created minimal 404.html for GitHub Pages SPA routing'
          );
        } else {
          console.warn('index.html not found, skipping 404.html generation');
        }

        // Create .nojekyll file to disable Jekyll processing on GitHub Pages
        writeFileSync(noJekyllPath, '');
        console.log('✓ Created .nojekyll file to disable Jekyll processing');
      },
    },
  ],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
