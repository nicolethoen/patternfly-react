# Evaluation: Delivering PatternFly as Web Components via Preact

## Executive Summary

This document evaluates two approaches for delivering PatternFly components as framework-agnostic web components:

1. **Approach A (this POC):** Keep the React source as-is, alias React to Preact at build time, wrap components as custom elements using `preact-custom-element`
2. **Approach B (Lit rewrite):** Rewrite the component library from scratch using Lit as the source of truth, then wrap for React consumption via `@lit/react`

Given 300+ React projects consuming the library today, Approach A offers a non-disruptive path to validate demand and feasibility before committing to a multi-year rewrite.

---

## Preact: Library Health Assessment

| Metric | Value |
|--------|-------|
| Monthly npm downloads | 110M+ |
| Weekly npm downloads | 28M |
| Bundle size (gzipped) | 4.7KB core, ~6KB with compat |
| GitHub stars | 38,800+ |
| Health score | 93/100 (inspect.software) |
| Last publish | v10.29.8, August 2026 |
| Next major | v11.0.0-rc.0 (Aug 10, 2026) |
| Dependencies | Zero |
| Maintenance score | 100/100 |
| Security vulnerabilities | Zero |
| License | MIT |

Preact is a first-tier ecosystem library. It powers production sites at scale and is actively maintained by a focused team with a consistent release cadence. The v11 release candidate specifically improves the web component story with updated `preact-custom-element` documentation.

---

## Shadow DOM vs Light DOM: Analysis

This is the central architectural question. PatternFly's CSS architecture significantly informs this decision.

### How PatternFly CSS Works Today

- **Class-based, not CSS-in-JS** - components apply BEM classes like `pf-v6-c-button`, `pf-m-primary`
- **Global stylesheet** - `patternfly.css` or per-component CSS files from `@patternfly/patternfly`
- **Theming via `:root` custom properties** - `--pf-t--global--color--brand--default`, `--pf-v6-c-button--BackgroundColor`, etc.
- **No style encapsulation** - designed for one shared stylesheet on the page
- **Component-level token overrides** - `--pf-v6-c-button--*` variables reference `--pf-t--*` globals

### Light DOM (Recommended for this POC)

**Pros:**

- **Shared CSS with React implementation** - the exact same `patternfly.css` stylesheet works for both React and web component consumers. No duplication, no drift.
- **Zero style injection complexity** - consumers load PatternFly CSS once, everything works.
- **Theming "just works"** - `:root` custom property overrides apply to all components regardless of delivery mechanism.
- **Portal-friendly** - Modal/Dropdown content rendered elsewhere in the document still picks up styles.
- **Familiar debugging** - DevTools show real DOM with real classes, no shadow boundary to inspect through.
- **Simpler implementation** - no `adoptedStyleSheets`, no constructable stylesheets, no style duplication.
- **Progressive enhancement** - can add shadow DOM later for specific components without changing the overall approach.

**Cons:**

- **No style isolation** - consumer CSS can accidentally override PatternFly classes (though BEM naming + `pf-v6-` prefix mitigates this significantly).
- **Global namespace pollution** - PatternFly class names exist in the document's class namespace.
- **Consumer responsibility** - consumers must load the stylesheet themselves.
- **Cannot guarantee visual consistency** - a consumer's `* { box-sizing: content-box }` or aggressive resets could break appearance.

### Shadow DOM

**Pros:**

- **True style encapsulation** - component internals cannot be accidentally broken by consumer CSS.
- **Guaranteed visual fidelity** - components look identical regardless of host page styles.
- **Cleaner DOM API** - implementation details are hidden; slots provide a clear content contract.
- **Self-contained** - each component is a black box (appealing for micro-frontend and third-party embedding scenarios).

**Cons:**

- **CSS duplication/injection required** - PatternFly's component CSS must be injected into every shadow root. This means either duplicating CSS per instance (memory + parse cost), or using `adoptedStyleSheets` (well-supported but adds build complexity). Either way, `patternfly-base.css` (tokens + reset) must also be present in each shadow root.
- **Different CSS file from React** - the React package uses a global stylesheet; shadow DOM would need per-component extracted CSS or constructable stylesheet bundles. This creates a maintenance fork.
- **Theming partially works, partially doesn't** - CSS custom properties *do* inherit through shadow boundaries, so `--pf-t--*` tokens work. But the *component rules* that consume those tokens must live inside the shadow root. This is a subtle but critical distinction.
- **Portals break encapsulation** - Modal, Popover, Dropdown all portal content to `document.body` by default. That content is outside the shadow root, needs its own styles, and can't use the host's shadow-scoped CSS.
- **Slots are not React children** - PatternFly's composition model (render props, `cloneElement`, context) doesn't map to `<slot>` without significant API redesign.
- **Accessibility concerns** - `aria-labelledby` and `aria-describedby` cannot cross shadow boundaries; focus management and screen reader announcement patterns need rethinking.
- **Form participation** - requires `ElementInternals` and `formAssociated` for form controls; PatternFly's current form model is React-controlled state.
- **Bundle size penalty** - each component's shadow root needs its own copy of relevant CSS rules, vs one shared global stylesheet.

### The Shared CSS Argument (Key Differentiator)

The light DOM approach means the **exact same `patternfly.css`** file works for both React apps and web component consumers:

```
React App                        Web Component App
    |                                    |
    v                                    v
patternfly.css (same file)        patternfly.css (same file)
    |                                    |
<Button> (React component)        <pf-button> (custom element)
className="pf-v6-c-button"       className="pf-v6-c-button"
```

With shadow DOM, you'd need a separate build pipeline to produce per-component CSS bundles or constructable stylesheets, and any CSS changes would need to be validated against *both* delivery mechanisms.

---

## Approach A (Preact Wrap) vs Approach B (Lit Rewrite): Comparison

| Dimension | Preact Wrap (Light DOM) | Lit Rewrite (Shadow DOM) |
|-----------|------------------------|--------------------------|
| **Effort** | Weeks (incremental) | 12-24+ months (full rewrite) |
| **Risk to 300+ React projects** | Zero - React package unchanged | High - React consumers must adopt `@lit/react` wrappers with different APIs |
| **Source of truth** | React components (existing, tested, mature) | New Lit components (must reach parity) |
| **Bundle size (framework)** | ~6KB (Preact + compat) | ~5KB (Lit core) |
| **CSS story** | Shared with React (one stylesheet) | Separate (shadow-scoped, injected per root) |
| **Theming** | Identical to React (`:root` vars) | Custom properties inherit, but rules must be inside shadow |
| **Style isolation** | None (BEM prefix provides practical isolation) | Full (shadow boundary) |
| **Portals/overlays** | Same challenge either way | Same challenge either way |
| **React DX** | Unchanged (native React components) | Degraded - `@lit/react` wrappers needed for events, complex props, TypeScript |
| **Non-React DX** | Custom elements with attribute/property API | Custom elements with attribute/property API |
| **SSR** | Preact supports SSR; WCs need Declarative Shadow DOM | Lit has `@lit-labs/ssr`; still requires hydration planning |
| **Incremental adoption** | Ship one component at a time, no breaking changes | Big-bang or painful dual-maintenance period |
| **Team expertise** | Existing React knowledge transfers directly | Requires learning Lit, decorators, reactive properties, shadow DOM patterns |
| **Long-term maintainability** | One source (React), one CSS, two delivery builds | One source (Lit) + React wrappers + shadow-scoped CSS build |

---

## Industry Context

### CMS.gov Design System (U.S. Government)

The [CMS Design System](https://design.cms.gov/components/overview/) (Centers for Medicare & Medicaid Services) ships their component library in **three formats: React, Preact, and Web Components**. They validated this exact approach — keeping React source and generating Preact + web component builds:

> "Through prototyping, we found that we can actually keep our components as they are now and swap React for Preact at build time to achieve the same end. We can generate a Preact version of the JavaScript bundle... without changing our component source code. A bonus discovery was that we could repackage these Preact components as web components with relatively little effort."

Their [discussion](https://github.com/CMSgov/design-system/discussions/2378) documents the incremental rollout strategy: start with a few components, get feedback, expand.

### Voorhoede (Design System Agency)

[Voorhoede](https://www.voorhoede.nl/en/blog/building-design-system-react-web-components/) built a client design system using the exact pattern we're exploring: author in React `.tsx`, compile to Web Components via Preact aliasing + `preact-custom-element`. They ship to multiple teams using different frameworks.

They found `preact-custom-element` needed customization for a *system* of interacting components (vs standalone widgets) and added event handling and shared styling providers. Their conclusion: the approach works but requires thought about component interop.

### Rechat (Production SDK)

[Rechat](https://raminmousavi.dev/blog/web-component-widgets-with-preact) ships a production real estate SDK as web component widgets built with `preact-custom-element`. Widgets are embedded in WordPress, React, Vue, and plain HTML sites. They use the light DOM approach with a shared global stylesheet.

### Carbon Design System (IBM)

Carbon is currently [investigating](https://github.com/carbon-design-system/ibm-products/issues/8900) whether to move to a web-component-first architecture with `@lit/react` wrappers. Their stated motivation:

> "We currently develop and maintain both React and Web Component versions of the same component. Over time, keeping feature and behavior parity between the two implementations has proven difficult and costly."

Their assessment identifies these risks:
- SSR complexity with hydration
- Components relying on React Context don't translate cleanly
- Wrapper maintenance still requires version synchronization
- Team bandwidth for WC education

### AgnosticUI (Post-Mortem)

The AgnosticUI project [documented their experience](https://master.dev/blog/post-mortem-rewriting-agnosticui-with-lit-web-components/) rewriting with Lit. Key findings:
- `@lit/react` wrappers are still necessary for good React DX (even with React 19's improved WC support)
- Shadow DOM accessibility requires careful manual work
- Form association requires explicit `ElementInternals` implementation
- The project is ongoing/"always a WIP"

---

## Recommendation

**Start with Approach A (Preact + Light DOM) as a low-risk proof of concept.** Here's why:

1. **No disruption to 300+ React consumers** - the React package remains the primary, unchanged deliverable.
2. **Validates demand** - before investing 12-24 months in a rewrite, confirm that non-React consumers actually exist and will adopt web components.
3. **Shared CSS eliminates maintenance fork** - one `patternfly.css`, one set of design tokens, one visual QA pipeline.
4. **Incremental** - ship 5 components, gather feedback, expand or pivot.
5. **Reversible** - if the POC reveals that shadow DOM is truly needed, the Lit rewrite path is still available; nothing is lost.
6. **Fast** - a working proof of concept in weeks, not months.

Shadow DOM can be evaluated as a follow-up for specific components where isolation is critical (e.g., components embedded in third-party pages). It doesn't have to be all-or-nothing.

The Lit rewrite remains a valid long-term strategy if the organization decides to go multi-framework, but it should be a *deliberate architectural bet* informed by data - not a first step.

---

## POC Scope

This proof of concept wraps the following atoms:
- **Button** - variant, disabled, block, size, loading
- **Badge** - read/unread
- **Label** - color, variant, status, compact
- **Spinner** - size, inline
- **Alert** - variant, title, inline, plain
- **Switch** - checked, disabled, label

### Running the POC

```bash
# From the project root:
yarn start:wc          # starts the test app on localhost:3000

# Or build the production bundle:
cd packages/patternfly-web-components
yarn build             # outputs dist/pf-elements.iife.js
yarn analyze           # opens interactive bundle treemap
```

### What the Registration Code Looks Like

The entire bridge between React components and custom elements is one file (`src/index.ts`). Each component requires a single `bridge()` call that maps lowercase HTML attributes to camelCase React props and handles boolean coercion:

```typescript
bridge(Button, [
  attr('variant'),
  attr('size'),
  attr('type'),
  bool('isDisabled'),
  bool('isBlock'),
  bool('isLoading'),
]);
```

HTML attributes are always lowercase and always strings. The `bool()` helper coerces attribute presence to `true` and absence to `false`. The `attr()` helper passes string values through unchanged. This is the one unavoidable piece of glue between the HTML and React worlds.

### Consumer Usage

```html
<link rel="stylesheet" href="patternfly.css" />
<script src="pf-elements.iife.js"></script>

<pf-button variant="primary">Click me</pf-button>
<pf-badge isread>24</pf-badge>
<pf-alert variant="success" title="Done" isinline></pf-alert>
```

Note: boolean attributes are lowercase (`isdisabled`, `isread`, `isinline`) because HTML normalizes all attribute names to lowercase.

### Measured Bundle Size

| | Raw | Gzip | Brotli |
|-|-----|------|--------|
| This bundle (6 components + Preact + icons + deps) | 84KB | 30KB | 27KB |
| React + ReactDOM alone (no components) | 140KB | 40KB | 36KB |

The bundle is larger than a minimal Preact app because PatternFly's Alert and Label components pull in transitive dependencies (Tooltip, icons). Tree-shaking per-component bundles would reduce this further.

---

## Open Questions

1. How many non-React consumers are actively requesting PatternFly components?
2. Is style isolation (shadow DOM) a hard requirement for any known use case?
3. Would a hybrid approach (light DOM for atoms, dedicated overlays for complex components) satisfy both camps?
4. What is the team's appetite for maintaining a second delivery mechanism long-term?

---

## Lessons from the POC

A few things we discovered during implementation:

1. **HTML attributes are always lowercase.** Browsers normalize `isDisabled` to `isdisabled`. A thin bridge layer is needed to map lowercase attributes back to camelCase React props. This is unavoidable for any web component solution (Lit has the same issue, solved by `@property` decorators).

2. **Boolean coercion is required.** HTML attributes are strings (`""` when present, `null` when absent). React expects booleans. The bridge handles this, but it means the "zero code" ideal of just calling `register(Component, 'tag-name', attrs)` doesn't quite work without a small wrapper.

3. **CSS loading in dev mode flashes.** Vite injects CSS asynchronously in dev mode for HMR. In production builds, CSS is extracted to a render-blocking `<link>` tag. This is a dev-time artifact, not a web components issue.

4. **Transitive dependencies inflate the bundle.** Alert and Label pull in Tooltip, which pulls in Popper-like positioning logic. Per-component entry points or tree-shaking would help in production.

5. **The approach works.** Despite the above friction points, the components render correctly using the same PatternFly CSS, with Preact as a ~6KB drop-in replacement for React's ~40KB runtime.
