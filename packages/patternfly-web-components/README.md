# @patternfly/react-web-components (POC)

PatternFly React components delivered as native Web Components via Preact aliasing.

## How it Works

1. The existing `@patternfly/react-core` React components are the source of truth (unchanged)
2. At build time, `react` and `react-dom` are aliased to `preact/compat` (~6KB vs ~40KB)
3. Components are registered as custom elements using `preact-custom-element`
4. Output: a self-contained IIFE bundle consumers load via `<script>` tag

## The Entire Registration Code

```typescript
import register from 'preact-custom-element';
import { Button, Badge, Label, Spinner, Alert, Switch } from '@patternfly/react-core';

register(Button, 'pf-button', ['variant', 'isDisabled', 'isBlock', 'size', 'isLoading'], { shadow: false });
register(Badge, 'pf-badge', ['isRead'], { shadow: false });
register(Label, 'pf-label', ['color', 'variant', 'status', 'isCompact'], { shadow: false });
register(Spinner, 'pf-spinner', ['size', 'isInline', 'aria-label'], { shadow: false });
register(Alert, 'pf-alert', ['variant', 'title', 'isInline', 'isPlain'], { shadow: false });
register(Switch, 'pf-switch', ['label', 'isChecked', 'isDisabled', 'aria-label'], { shadow: false });
```

That's it. One `register()` call per component. The rest is build config.

## Usage

```html
<link rel="stylesheet" href="path/to/@patternfly/patternfly/patternfly.css" />
<script src="path/to/pf-elements.iife.js"></script>

<pf-button variant="primary">Click me</pf-button>
<pf-badge>7</pf-badge>
<pf-label color="blue">Status</pf-label>
<pf-spinner size="md"></pf-spinner>
<pf-alert variant="success" title="All good" isInline></pf-alert>
<pf-switch label="Notifications"></pf-switch>
```

## Quick Start

```bash
# Build the bundle
yarn build

# Build with interactive bundle size report
yarn analyze
```

## Side-by-Side Test App

See changes to React components reflected in both React and Web Component renderings simultaneously:

```bash
cd test-app
yarn dev
```

Opens three servers:
- **:3000** — Shell with split-pane comparison view
- **:3001** — React panel (standard React + PF components)
- **:3002** — Web Component panel (Preact-aliased custom elements)

## Bundle Size

| | Raw | Gzip | Brotli |
|-|-----|------|--------|
| This bundle (6 components + Preact) | 84KB | 30KB | 27KB |
| React + ReactDOM alone (no components) | 140KB | 40KB | 36KB |

## Evaluation

See [EVALUATION.md](./EVALUATION.md) for the full comparison of this approach vs a Lit rewrite, including shadow DOM vs light DOM analysis.
