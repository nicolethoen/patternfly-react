import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

const wcPkgRoot = path.resolve(__dirname, '../../src');

export default defineConfig({
  root: __dirname,
  plugins: [preact()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      '@patternfly/patternfly-web-components/button': path.join(wcPkgRoot, 'elements/button.ts'),
      '@patternfly/patternfly-web-components/badge': path.join(wcPkgRoot, 'elements/badge.ts'),
      '@patternfly/patternfly-web-components/label': path.join(wcPkgRoot, 'elements/label.ts'),
      '@patternfly/patternfly-web-components/spinner': path.join(wcPkgRoot, 'elements/spinner.ts'),
      '@patternfly/patternfly-web-components/alert': path.join(wcPkgRoot, 'elements/alert.ts'),
      '@patternfly/patternfly-web-components/switch': path.join(wcPkgRoot, 'elements/switch.ts'),
      '@patternfly/patternfly-web-components/card': path.join(wcPkgRoot, 'elements/card.ts'),
      '@patternfly/patternfly-web-components': path.join(wcPkgRoot, 'index.ts')
    }
  },
  server: { port: 3002 }
});
