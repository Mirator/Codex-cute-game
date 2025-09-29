import { defineConfig } from 'vite';

const repository = process.env.GITHUB_REPOSITORY ?? '';
const repoName = repository.split('/')[1] ?? '';
const useGitHubPagesBase = process.env.GITHUB_PAGES === 'true' && repoName.length > 0;

export default defineConfig({
  base: useGitHubPagesBase ? `/${repoName}/` : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
