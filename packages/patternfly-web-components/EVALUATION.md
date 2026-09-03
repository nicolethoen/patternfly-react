# Evaluation: Delivering PatternFly as Web Components via Preact

## Executive Summary

This POC demonstrates that PatternFly React components can be delivered as web components **without modifying any React component source code or public APIs**. By aliasing React to Preact at build time, the existing React components render inside native custom elements at a fraction of React's bundle cost (~6KB vs ~40KB runtime).

Both the React and web component implementations share **the same PatternFly CSS** — no duplication, no drift, no Shadow DOM isolation boundary. Consumers load PF stylesheets once; both `<Button>` (React) and `<pf-button>` (custom element) produce identical markup and styling. This means React and web component instances can coexist on the same page with zero style discrepancies.

**What works well:** Leaf components (Button, Badge, Alert, Switch) and compositional components (Card with sub-elements) bridge cleanly. Registration is 5–17 lines of declarative glue per component family — not a parallel implementation. When the underlying React component changes, the web component gets the update for free with no code change needed unless the prop API itself changes.

**Attribute reactivity works out of the box:** Changing an attribute on a rendered element re-renders the component, so imperative DOM manipulation integrates naturally (`el.setAttribute('variant', 'danger')`). This makes the web components compatible with vanilla JS, jQuery, Drupal behaviors, or any templating system that manipulates the DOM.

**Where it doesn't fit:** Complex interactive components that depend on React portals, focus traps, cross-component state, or lifecycle side effects (Modal, Select, Wizard) cannot be meaningfully bridged. These remain React-only, with guidance to use native alternatives (e.g. `<dialog>`) with PF CSS classes.

**Trade-offs accepted:**
- No Shadow DOM — consumers must load PF CSS globally, but gain the ability to mix frameworks on one page with consistent styling
- Limited to the "markup and styling" tier of the component library — behavioral components require purpose-built implementations regardless of approach
- Depends on Preact compatibility — mitigated by the fact that only basic React features (props, conditional classes, forwardRef) are exercised

Given 300+ React projects consuming the library today, this approach validates demand without disrupting existing consumers or committing to a multi-year rewrite.

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

## Could Lit-First + `@lit/react` Preserve the Existing React API?

A common argument for the Lit rewrite approach is: "We'll rewrite in Lit, then wrap with `@lit/react` so React consumers won't feel the pain." This section examines that claim honestly.

### What `@lit/react` Wrappers Can Do

For a simple component like Button, a wrapper can replicate today's API almost exactly:

```typescript
import { createComponent } from '@lit/react';
import { PfButton } from '@patternfly/pf-lit-core';

export const Button = createComponent({
  tagName: 'pf-button',
  elementClass: PfButton,
  react: React,
  events: { onClick: 'click' },
});
// Consumer code: <Button variant="primary" isDisabled onClick={fn}>
// Looks identical to today — no migration pain
```

For atoms (Button, Badge, Label, Spinner), this works. Props map to properties, events map to callbacks, TypeScript types can be generated.

### Patterns That Cannot Be Preserved by a Thin Wrapper

PatternFly uses React-specific patterns extensively. These do not survive a web component boundary:

**1. React Context (used throughout the library)**

```tsx
// Today: FormGroup provides validation state to children via Context
<FormGroup label="Name" isRequired>
  <TextInput validated={ValidatedOptions.error} />
</FormGroup>
```

Context does not cross web component boundaries. The wrapper would need to intercept context values and pass them as properties to the Lit component — reimplementing orchestration logic in the wrapper itself.

**2. Compound components**

```tsx
// Today: parent-child communication via Context/cloneElement
<Select onSelect={handleSelect}>
  <SelectOption value="1">One</SelectOption>
  <SelectOption value="2">Two</SelectOption>
</Select>
```

In Lit, this becomes slots + events — a fundamentally different model. The wrapper must intercept React children, serialize them into a data structure, and pass them as a property. The wrapper becomes a substantial React component.

**3. Render props / children-as-function**

```tsx
// Today: React-specific composition pattern
<Toolbar>
  <ToolbarContent>
    <ToolbarFilter chips={filters} deleteChip={onDelete}>
      {filterInput}
    </ToolbarFilter>
  </ToolbarContent>
</Toolbar>
```

No web component equivalent exists. The wrapper must fully reimplement this logic in React, rendering a Lit component internally.

**4. Controlled component patterns**

```tsx
// Today: React controlled state
<TextInput value={name} onChange={(_, val) => setName(val)} />
```

Lit components manage their own state. Making them behave as React "controlled components" requires the wrapper to fight the web component's internal state management — intercepting property changes, suppressing internal updates, and reflecting React state back down. This is a known source of bugs (see [lit/lit#5009](https://github.com/lit/lit/issues/5009) — wrappers trigger setters on every re-render).

**5. TypeScript generics**

```tsx
// Today: generic over row data type
<Table<ServerRow> rows={data} columns={columns} />
```

Web components cannot be generic. The wrapper could add TypeScript generics at the React layer, but the underlying Lit component would not enforce them.

### Wrapper Thickness by Component Complexity

| Component complexity | Wrapper feasibility | Wrapper code |
|---------------------|--------------------|--------------------|
| Atoms (Button, Badge, Label) | Easy, near-identical API | 5-10 lines |
| Simple interactive (Switch, Checkbox) | Doable, minor differences | 20-40 lines |
| Composite (Alert, Card, Tabs) | Possible with effort | 50-100+ lines |
| Complex (Select, Table, Wizard, DatePicker) | Wrapper IS the component | 200+ lines, reimplements React logic |

### The Core Problem

For the top ~30% of components (atoms + simple composites), `@lit/react` wrappers can replicate the existing React API closely enough that consumers barely notice.

For the remaining ~70% (complex interactive components that use Context, compound patterns, controlled state), the wrappers become so thick that you are effectively maintaining **two implementations** — the Lit source AND a substantial React wrapper — which is the exact duplication problem the rewrite was supposed to eliminate.

### Hidden Costs of the Wrapper Layer

From Carbon's investigation ([ibm-products#8900](https://github.com/carbon-design-system/ibm-products/issues/8900)) and AgnosticUI's [post-mortem](https://blog.master.dev/post-mortem-rewriting-agnosticui-with-lit-web-components/):

- **Version synchronization**: wrapper must update whenever the Lit component's API changes
- **Three-layer debugging**: bugs can originate in the app, the React wrapper, or the Lit component
- **Re-render performance**: `@lit/react` calls property setters on every React re-render, requiring manual dirty-checking in every Lit component
- **SSR gaps**: web components don't execute during SSR; the wrapper renders a bare custom element tag until hydration

### The Honest Trade-Off

| | Approach A (Preact-wrap) | Approach B (Lit + `@lit/react`) |
|-|--------------------------|--------------------------------|
| **React consumer migration** | None — same package, same API | Breaking change for all 300+ consumers, even with wrappers |
| **What you maintain** | React source + thin bridge file | Lit source + thick React wrappers for complex components |
| **Duplication** | Build step only | Logic duplication in wrappers |
| **What you gain** | Non-React delivery with zero disruption | True framework independence + style isolation |
| **What you risk** | Preact compatibility edge cases | Multi-year rewrite; wrapper bugs; consumer migration fatigue |

Neither approach is "free." Approach A bets on React remaining the source of truth and Preact staying compatible. Approach B bets on web components as the future and accepts the cost of a breaking migration for your largest consumer base.

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

## POC Scope and Results

### What Was Built

| Tier | Bridge Pattern | Components | Lines of Glue |
|------|---------------|------------|---------------|
| Atoms | `bridge()` | Button, Badge, Label, Spinner, Alert, Switch | 5–8 per component |
| Compound | `bridgeFamily()` | Card (+ Header, Title, Body, Footer) | ~17 total |
| Boundary | N/A (documented) | Modal — not bridgeable | 0 (explanation only) |

### How to Run

```bash
yarn start:wc    # dev server on localhost:3000
yarn build       # production IIFE + ESM bundles
yarn test        # bridge + per-component tests
yarn analyze     # interactive bundle treemap
```

### Consumer API

```html
<link rel="stylesheet" href="patternfly.css" />
<script src="pf-elements.iife.js"></script>

<pf-button variant="primary">Click me</pf-button>
<pf-card iscompact>
  <pf-card-body>Content</pf-card-body>
  <pf-card-footer><pf-button variant="primary">Action</pf-button></pf-card-footer>
</pf-card>
```

ESM alternative (tree-shakeable): `import '@patternfly/patternfly-web-components/button'`

Boolean attributes are lowercase (`isdisabled`, `iscompact`) because HTML normalizes attribute names.

### Bundle Size

| | Gzip | Brotli |
|-|------|--------|
| All components (IIFE) | 30KB | 27KB |
| Single component + Preact runtime | ~5KB | ~4KB |
| React + ReactDOM (for comparison) | 40KB | 36KB |

---

## How the Bridge Works

### Atoms: `bridge()`

For standalone components with no custom element children. Uses `preact-custom-element` — one `render()` per element's `connectedCallback`:

```typescript
import { Button } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Button, 'pf-button', [attr('variant'), attr('size'), bool('isDisabled'), bool('isBlock')]);
```

### Compound: `bridgeFamily()`

For components with nested sub-elements. A single Preact render tree owned by the root element — child elements are passive markers, not independent renderers:

```typescript
import { Card, CardHeader, CardBody, CardFooter } from '@patternfly/react-core';
import { bridgeFamily, attr, bool } from '../bridge';

bridgeFamily(Card, 'pf-card', [attr('variant'), bool('isCompact'), bool('isFlat')], {
  'pf-card-header': { component: CardHeader, props: [] },
  'pf-card-body':   { component: CardBody, props: [bool('isFilled')] },
  'pf-card-footer': { component: CardFooter, props: [] },
});
```

The root walks its DOM children, maps child tags to React components, and renders the family as one tree. Other custom elements (e.g. `pf-button` inside `pf-card-footer`) are treated as opaque — their attributes are preserved but their internals aren't touched.

### Why compound components can't use `bridge()` for children

Each `bridge()` element fires its own `render()`. When nested, this creates competing Preact render trees targeting overlapping DOM. `bridgeFamily()` solves this with a single render owned by the root.

### Modal: Where the Bridge Stops

Modal depends on portals, focus traps, callback props, body side effects, and controlled state — none of which map to HTML attributes. It cannot be bridged.

**Alternatives for non-React consumers:**
- Use native `<dialog>` with PF CSS classes (`pf-v6-c-modal-box`)
- Or deliver a hand-written `<pf-modal>` custom element in the same package — the consumer API stays the same, only the implementation strategy differs

---

## The Boundary Rule

| Pattern | Bridgeable? | Example |
|---------|-------------|---------|
| Props → CSS classes | Yes (`bridge()`) | Button, Badge, Label |
| Light DOM composition | Yes (`bridgeFamily()`) | Card + sub-elements |
| Nested leaf elements inside families | Yes (opaque) | `pf-button` in `pf-card-footer` |
| Boolean/string attributes | Yes | All atoms and compound roots |
| React Context between components | No | Expandable Card, Form validation |
| Portals (renders outside host) | No | Modal, Popover, Tooltip |
| Callback props (event handlers) | Partial | Requires custom event bridge |
| Controlled state (parent owns open/close) | No | Modal, Drawer |
| Focus management (trap, restore) | No | Modal, Dropdown |

**Rule of thumb:** If a component's value comes from its *markup and styling*, the bridge works. If its value comes from its *behavior and lifecycle*, it needs a purpose-built implementation.

---

## Open Questions

There are existing consumers of `patternfly-elements` (the Lit-based web components library), confirming that demand for non-React delivery exists. What we don't yet know:

1. **How large is the PFE consumer base?** npm shows ~5K weekly downloads — but how many distinct teams/projects does that represent, and how critical is PFE to them?
2. **Would those consumers accept a light DOM replacement?** Do any of them depend on Shadow DOM encapsulation, or do they just need pre-built elements with PF styling?
3. **What's their migration tolerance?** If we offer a replacement under different element names or slightly different APIs, will they adopt it — or is stability more important than unification?
4. **What is the team's appetite for maintaining a second delivery mechanism long-term?** Even if minimal, the bridge layer is a new surface area.
5. **Are there net-new consumers waiting?** Teams who *would* use PatternFly web components but don't use PFE today — what's blocking them?

---

## Lessons from the POC

A few things we discovered during implementation:

1. **HTML attributes are always lowercase.** Browsers normalize `isDisabled` to `isdisabled`. A thin bridge layer is needed to map lowercase attributes back to camelCase React props. This is unavoidable for any web component solution (Lit has the same issue, solved by `@property` decorators).

2. **Boolean coercion is required.** HTML attributes are strings (`""` when present, `null` when absent). React expects booleans. The bridge handles this, but it means the "zero code" ideal of just calling `register(Component, 'tag-name', attrs)` doesn't quite work without a small wrapper.

3. **CSS loading in dev mode flashes.** Vite injects CSS asynchronously in dev mode for HMR. In production builds, CSS is extracted to a render-blocking `<link>` tag. This is a dev-time artifact, not a web components issue.

4. **Transitive dependencies inflate the bundle.** Alert and Label pull in Tooltip, which pulls in Popper-like positioning logic. The per-component ESM build mitigates this — consumers only load the dependencies of the components they actually import.

5. **Compound components cannot use `preact-custom-element` for children.** When multiple nested custom elements each fire their own `render()`, the result is conflicting Preact render trees targeting overlapping DOM. The solution is `bridgeFamily()`: a single render call owned by the root element, which walks its children and maps child custom element tags to their React counterparts. Child elements are passive markers, not independent renderers.

6. **Opaque nesting works.** Custom elements from *outside* a family (e.g. a `pf-button` inside a `pf-card-footer`) can coexist. The root family treats them as opaque — preserving their tag and attributes but not interfering with their own render lifecycle. This means families compose with leaf elements naturally.

7. **The approach works.** Despite the above friction points, both leaf and compound components render correctly using the same PatternFly CSS, with Preact as a ~6KB drop-in replacement for React's ~40KB runtime.

---

## Devil's Advocate: Counterarguments and Responses

| # | Counterargument | Severity | Response |
|---|----------------|----------|----------|
| 1 | **Easy part proven, hard part unknown** — Atoms are trivial; the real test is Select, Table, Wizard | High | Partially addressed — `bridgeFamily()` proves composition works (Card). Truly interactive components are equally hard in Lit. The boundary is the strategy, not a gap. |
| 2 | **Preact compat is an assumption** — One incompatibility could silently break a component | Medium | Mitigated — only basic React features used (props, forwardRef, classes). CI tests catch regressions. `preact/compat` is battle-tested across major libraries. |
| 3 | **Not "real" web components** — No Shadow DOM, slots, or ElementInternals | Low | Reframed — custom elements ARE web components. Shadow DOM is optional. Consumers care about API and correctness, not internals. |
| 4 | **Light DOM lacks encapsulation** — Hostile CSS environments could break styling | Low | Accepted — target audience (PF users, Drupal, vanilla JS) already loads PF CSS globally. BEM naming provides practical isolation. Shadow DOM can be added per-component later if needed. |
| 5 | **Bundle will grow unacceptably** — 30KB for 6 components extrapolates poorly | Medium | Addressed — per-component ESM tree-shaking. Single component + runtime = ~5KB gzipped. The 30KB IIFE includes transitive deps from Alert/Label. |
| 6 | **Bridge IS maintenance burden** — Every React prop change needs a bridge update | Medium | Mitigated — bridge is 3–7 lines of declarative config per component. Adding a prop = adding one line. Contrast with 100–500 lines of Lit reimplementation per component. |
| 7 | **Testing burden doubles** — Must test every component twice | Medium | Addressed — layered strategy: bridge utility tests (once), per-component smoke tests (10–20 lines each verify attribute → class pipeline), React tests still cover behavior. |
| 8 | **Industry examples don't prove scale** — Cited projects wrap small widgets, not 80+ components | Low | Reframed — we're wrapping 10–15 atoms + a few compound families, which matches the proven tier. Scope boundary prevents scaling problems. |
| 9 | **Optimizing for today's inertia** — Industry is moving WC-first; React source of truth may become irrelevant | High (strategic) | Accepted as de-risking — this POC delivers in weeks, validates demand, and components can be migrated to native WC under the same tags without breaking consumers. Sequential, not competing. |

**Overall verdict:** No counterargument invalidates the bounded POC. The strongest objections argue for discipline and clear communication, not abandonment. The POC validates demand cheaply before committing to larger bets.

---

## Why Not Ask React Consumers to Migrate?

The primary counterproposal to this POC is: rewrite everything in Lit, then wrap with `@lit/react` and ask 300+ React-consuming projects to migrate. Industry evidence suggests this path carries more risk than it appears.

### React 19's Native Web Component Support

React 19 scores 100% on [Custom Elements Everywhere](https://custom-elements-everywhere.com/). The core integration works:

- Props set as properties when a matching DOM property exists on the element
- Custom events wire up via `onEventName` convention
- Boolean attributes handled correctly (presence = true, absence = false)

However, **"works" and "good DX" are not the same thing** ([Rob Levin, Frontend Masters post-mortem, March 2026](https://frontendmasters.com/blog/post-mortem-rewriting-agnosticui-with-lit-web-components/)):

| DX concern | Native React 19 | With `@lit/react` wrapper |
|---|---|---|
| TypeScript JSX types | Manual `declare module 'react/jsx-runtime'` declarations per element | Automatic — generated from component class |
| Complex props (objects, arrays) | Works only if DOM property defined on class | Handled via `useLayoutEffect` |
| Event mapping | `onEventName` works but multi-word events feel clunky | Explicit mapping with typed callbacks |
| IDE autocomplete | No prop suggestions for custom elements | Full autocomplete from wrapper types |
| SSR/Hydration | DSD hydration unsupported; event listener bug (fixed mid-2026) | Same limitations apply |

### What React Consumers Would Lose

Today, PatternFly React consumers get:

- **Full native React components** with TypeScript inference, IDE autocomplete, and standard prop patterns
- **Direct access to React features** — Context, refs, hooks, Suspense boundaries, error boundaries
- **First-class testing** with React Testing Library, no custom element registration needed
- **Zero framework overhead** — no wrapper layer, no property-setting timing issues

A migration to `@lit/react` wrappers would mean:

- Every `import { Button } from '@patternfly/react-core'` changes
- TypeScript types change (wrapper-generated vs source-derived)
- Event handling patterns change (callback props → event listeners)
- Testing approaches change (must register elements, await updates)
- Performance characteristics change (`@lit/react` calls property setters on every React re-render)

### What Lit's Own Maintainer Says

Justin Fagnani (Lit co-creator), when asked ["Is `@lit/react` still necessary?"](https://github.com/lit/lit/discussions/5068) (August 2025):

> "I'd say if you can use the built-in custom element support, you probably should."

This acknowledges that wrappers are a compatibility bridge, not a long-term architectural advantage. React 19 made them optional — but "optional" still means "worse DX than native React components."

### The Bottom Line

| | This POC (Preact-wrap) | Lit-first + `@lit/react` |
|---|---|---|
| React consumer impact | Zero — existing API unchanged | 300+ projects migrate |
| Non-React consumer impact | New web components available | New web components available |
| DX for React consumers | Native React (best possible) | Wrapper simulation (functional but degraded) |
| Migration risk | None — additive delivery | High — breaking change for all React consumers |
| Time to value | Weeks (atoms) to months (compound) | 12–24 months before any consumer sees benefit |

The Lit-first approach asks the largest consumer base (React) to accept a DX regression so that the smallest consumer base (non-React) can have web components. This POC inverts that: React consumers keep the best possible DX, and non-React consumers get web components — both from the same source.

---

## Proposed Next Steps: Toward a Unified Delivery

### Strategic Goal

One maintained component source (React) delivering two outputs: native React components for React consumers, and custom elements for everyone else. Over time, this could replace `patternfly-elements` as the web components delivery — meaning one team maintains one codebase for both audiences.

### Current State

There *is* existing demand for web components — `patternfly-elements` has consumers. The size and insistence of that demand is not well characterized, but the existence of the PFE project and its users confirms the need is real. The question isn't "should we deliver web components?" — it's "what's the cheapest, least-disruptive way to do it without fragmenting the ecosystem further?"

### Why Replacement is Desirable

Today, PatternFly maintains two separate implementations:

- **`@patternfly/react-core`** — React components, `pf-v6-*` CSS classes, Light DOM
- **`@patternfly/elements`** (patternfly-elements) — Lit web components, `pf-v5-*` naming, Shadow DOM, own CSS custom properties

These diverge over time. Feature parity is never complete. Bug fixes happen in one but not the other. The naming and API differences confuse consumers who use both. Two teams maintain two implementations of the same design language.

### Feasibility Assessment

**Clearly feasible (bridge approach):**
- Leaf components: Button, Badge, Label, Alert, Switch, Spinner, Avatar, Banner, Icon, Progress, Chip
- Compound components: Card, Accordion, Tabs, Label Group
- Estimated ~60% of patternfly-elements component count

**Feasible but requires hand-written implementations:**
- Modal, Popover, Tooltip, Dropdown, Select, Clipboard Copy
- Would use vanilla custom elements + PF CSS classes in the same package
- More maintenance than bridged components but less than maintaining a full Lit library

**Significant open risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Shadow DOM dependency** — PFE consumers may rely on style encapsulation | Breaking change for those consumers | Audit PFE consumer usage; offer opt-in encapsulation via adoptedStyleSheets if needed |
| **API divergence** — PFE and PF React have different prop names, different features, different element names | Migration guide needed per component | Reconcile APIs component-by-component before delivering replacement |
| **CSS system differences** — PFE uses `--pf-v5-c-*` tokens; PF React uses `pf-v6-*` classes | Theming breaks for PFE consumers | Map old tokens to new system or provide a compat stylesheet |
| **PFE-only features** — Some PFE components have capabilities not in PF React | Feature gap in replacement | Add features to React components first, then bridge inherits them |
| **Complex components** — Hand-written replacements for Modal, Select, etc. need to match PFE maturity | Under-delivery risk | Phase these last; validate with consumers before sunsetting PFE equivalents |
| **Consumer migration timeline** — PFE consumers need time to transition | Can't sunset PFE immediately | Run both in parallel during transition with clear deprecation timeline |

### Proposed Phases

**Phase 1: Audit and Reconcile (pre-requisite)**
- Map every patternfly-elements component to its patternfly-react equivalent
- Identify naming differences, API gaps, and feature discrepancies
- Prioritize by consumer usage data (which PFE components are most used?)
- Resolve: do any PFE consumers *require* Shadow DOM encapsulation?

**Phase 2: Deliver Aligned Atoms via Bridge**
- Starting with the highest-overlap components (Button, Badge, Label, Card, Alert)
- Ensure element names, attribute APIs, and visual output match the reconciled spec
- Ship as `@patternfly/patternfly-web-components` alongside PFE (non-breaking, additive)
- Gather consumer feedback

**Phase 3: Expand to Compound + Hand-Written**
- Deliver compound components via `bridgeFamily()` (Accordion, Tabs, Nav)
- Build hand-written implementations for complex components (Modal, Select, Popover)
- Each hand-written component uses PF CSS classes — same visual output as React

**Phase 4: Deprecate and Sunset PFE**
- Once component coverage and consumer confidence are sufficient
- Provide a migration guide mapping old PFE element names/attributes to new equivalents
- Run a deprecation period with both packages available
- Sunset `@patternfly/elements`

### Honest Assessment

This is a multi-quarter effort, not a quick win. The POC proves the *mechanism* works, but replacing a production library requires:

- Organizational alignment (PFE maintainers, React maintainers, and consumers all agreeing)
- Feature parity (or an agreed-upon subset)
- Migration tooling and documentation
- Consumer patience during the transition

The POC's immediate value is delivering web components to non-React consumers *today* without waiting for any of the above. The longer-term convergence is the aspirational goal — achievable incrementally, component by component, validated by real adoption at each step.
