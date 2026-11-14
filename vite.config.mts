import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
const version = pkg.version || '0';

export default defineConfig({
  // Transmission serves this tree under /transmission/web/, not /.
  base: './',
  plugins: [
    vue(),
    nodePolyfills({
      include: ['buffer', 'path', 'events', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Plain HTTP does not provide Web Crypto (crypto.subtle), and script-src 'self' blocks workers.
      // Rusha's sync digest computes SHA-1 without crypto.subtle.
      'simple-sha1': path.resolve(__dirname, 'shims/simple-sha1.js'),
      'uint8-util': path.resolve(__dirname, 'shims/uint8-util.js'),
    },
  },
  define: {
    'process.env.PACKAGE_VERSION': JSON.stringify(version),
    'process.env.BASE_URL': JSON.stringify('./'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
  },
});
