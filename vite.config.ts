import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    port: 8000,
  },

  plugins: [],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
