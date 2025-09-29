import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Codex-cute-game/',
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
