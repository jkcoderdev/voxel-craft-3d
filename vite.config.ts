import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    port: 8000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  plugins: [],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
