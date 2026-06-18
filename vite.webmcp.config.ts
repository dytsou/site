import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/webmcp-bootstrap.ts'),
      formats: ['iife'],
      name: 'WebMcpBootstrap',
      fileName: () => 'webmcp-bootstrap.js',
    },
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
