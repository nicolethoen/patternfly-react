import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: __dirname,
  plugins: [preact()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  server: { port: 3002 }
});
