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

const sharedPlugins = [
  stubCss(),
  alias({
    entries: [
      { find: 'react', replacement: 'preact/compat' },
      { find: 'react-dom', replacement: 'preact/compat' },
      { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
    ]
  }),
  resolve({ browser: true, extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
  commonjs()
];

/**
 * Build 1: Per-component ESM chunks (tree-shakable).
 * Consumers import individual elements; Preact is split into a shared chunk.
 */
const esmBuild = {
  input: {
    index: 'src/index.ts',
    'elements/button': 'src/elements/button.ts',
    'elements/badge': 'src/elements/badge.ts',
    'elements/label': 'src/elements/label.ts',
    'elements/spinner': 'src/elements/spinner.ts',
    'elements/alert': 'src/elements/alert.ts',
    'elements/switch': 'src/elements/switch.ts'
  },
  output: {
    dir: 'dist/esm',
    format: 'es',
    chunkFileNames: 'shared/[name]-[hash].js',
    sourcemap: true
  },
  plugins: [
    ...sharedPlugins,
    typescript({ tsconfig: './tsconfig.json', outDir: 'dist/esm' }),
    terser({ maxWorkers: 1 })
  ]
};

/**
 * Build 2: Single IIFE bundle (drop-in script tag).
 * Includes everything — no tree-shaking, but simplest for consumers
 * who just want one <script> tag.
 */
const iifeBuild = {
  input: 'src/index.ts',
  output: {
    file: 'dist/pf-elements.iife.js',
    format: 'iife',
    name: 'PfElements',
    sourcemap: true
  },
  plugins: [
    ...sharedPlugins,
    typescript({ tsconfig: './tsconfig.json', outDir: 'dist' }),
    terser({ maxWorkers: 1 })
  ]
};

const builds = [esmBuild, iifeBuild];

if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer');
  builds[0].plugins.push(
    visualizer({
      filename: 'dist/bundle-report.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: true,
      title: 'PatternFly Web Components Bundle (ESM)'
    })
  );
}

export default builds;
