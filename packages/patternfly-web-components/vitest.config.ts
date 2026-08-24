import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

function stubCss(): Plugin {
  return {
    name: 'stub-css',
    enforce: 'pre',
    resolveId(source) {
      if (/\.css$/.test(source)) {
        return '\0stub-css';
      }
    },
    load(id) {
      if (id === '\0stub-css') {
        return 'export default {}';
      }
    }
  };
}

export default defineConfig({
  plugins: [stubCss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  }
});
