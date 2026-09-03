# @patternfly/patternfly-web-components (POC)

PatternFly React components delivered as native Web Components via Preact aliasing — no changes to React source code or APIs.

## How it Works

1. Existing `@patternfly/react-core` components are the source of truth (unchanged)
2. At build time, `react` and `react-dom` are aliased to `preact/compat` (~6KB vs ~40KB)
3. Components are registered as custom elements via `bridge()` (atoms) or `bridgeFamily()` (compound)
4. Output: per-component ESM chunks (tree-shakeable) + an all-in-one IIFE bundle

## Registration

```typescript
// Atom — one bridge() call per component
import { Button } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Button, 'pf-button', [attr('variant'), attr('size'), bool('isDisabled'), bool('isBlock')]);

// Compound — one bridgeFamily() call per component family
import { Card, CardHeader, CardBody, CardFooter } from '@patternfly/react-core';
import { bridgeFamily, attr, bool } from '../bridge';

bridgeFamily(Card, 'pf-card', [attr('variant'), bool('isCompact')], {
  'pf-card-header': { component: CardHeader, props: [] },
  'pf-card-body':   { component: CardBody, props: [bool('isFilled')] },
  'pf-card-footer': { component: CardFooter, props: [] },
});
```

## Usage

```html
<link rel="stylesheet" href="path/to/@patternfly/patternfly/patternfly.css" />
<script src="path/to/pf-elements.iife.js"></script>

<pf-button variant="primary">Click me</pf-button>
<pf-card iscompact>
  <pf-card-body>Content</pf-card-body>
  <pf-card-footer><pf-button variant="primary">Action</pf-button></pf-card-footer>
</pf-card>
```

Or use ESM per-component imports (tree-shakeable):

```javascript
import '@patternfly/patternfly-web-components/button';
import '@patternfly/patternfly-web-components/card';
```

## Quick Start

```bash
# From project root:
yarn start:wc       # dev server on localhost:3000

# Or from this package:
yarn build          # production IIFE + ESM bundles
yarn test           # bridge + per-component tests
yarn analyze        # interactive bundle treemap
```

## Bundle Size

| | Gzip | Brotli |
|-|------|--------|
| All components (IIFE) | 30KB | 27KB |
| Single component + Preact runtime | ~5KB | ~4KB |
| React + ReactDOM (for comparison) | 40KB | 36KB |

## Evaluation

See [EVALUATION.md](./EVALUATION.md) for the full analysis: approach comparison, boundary rules, counterarguments, and proposed next steps.
