import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

/**
 * Stub CSS imports — consumers load patternfly.css globally,
 * so we don't bundle CSS into the JS output.
 */
function stubCss() {
  return {
    name: 'stub-css',
    resolveId(source) {
      if (source.endsWith('.css')) {
        return { id: '\0stub-css', moduleSideEffects: false };
      }
      return null;
    },
    load(id) {
      if (id === '\0stub-css') {
        return 'export default {};';
      }
      return null;
    }
  };
}

const plugins = [
  stubCss(),
  alias({
    entries: [
      { find: 'react', replacement: 'preact/compat' },
      { find: 'react-dom', replacement: 'preact/compat' },
      { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
    ]
  }),
  resolve({ browser: true }),
  commonjs(),
  typescript({ tsconfig: './tsconfig.json' }),
  terser({ maxWorkers: 1 })
];

if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer');
  plugins.push(
    visualizer({
      filename: 'dist/bundle-report.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: true,
      title: 'PatternFly Web Components Bundle'
    })
  );
}

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/pf-elements.iife.js',
      format: 'iife',
      name: 'PfElements',
      sourcemap: true
    },
    {
      file: 'dist/pf-elements.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins
};
