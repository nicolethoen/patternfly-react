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

# Or build the production bundles:
cd packages/patternfly-web-components
yarn build             # outputs dist/iife/pf-elements.iife.js + dist/esm/
yarn analyze           # opens interactive bundle treemap
yarn test              # runs bridge + per-component tests
```

### What the Registration Code Looks Like

Each component has a dedicated registration file in `src/elements/`. A single `bridge()` call maps lowercase HTML attributes to camelCase React props and handles boolean coercion:

```typescript
// src/elements/button.ts
import { Button } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Button, 'pf-button', [
  attr('variant'),
  attr('size'),
  attr('type'),
  bool('isDisabled'),
  bool('isBlock'),
  bool('isLoading')
]);
```

HTML attributes are always lowercase and always strings. The `bool()` helper coerces attribute presence to `true` and absence to `false`. The `attr()` helper passes string values through unchanged. This is the one unavoidable piece of glue between the HTML and React worlds.

The barrel `src/index.ts` re-exports all elements for a "load everything" option, while individual files enable tree-shaking.

### Consumer Usage

**Drop-in script tag (IIFE — loads all components):**

```html
<link rel="stylesheet" href="patternfly.css" />
<script src="pf-elements.iife.js"></script>

<pf-button variant="primary">Click me</pf-button>
<pf-badge isread>24</pf-badge>
<pf-alert variant="success" title="Done" isinline></pf-alert>
```

**ESM per-component imports (tree-shakeable — loads only what you use):**

```javascript
import '@patternfly/patternfly-web-components/button';
import '@patternfly/patternfly-web-components/alert';
```

Note: boolean attributes are lowercase (`isdisabled`, `isread`, `isinline`) because HTML normalizes all attribute names to lowercase.

### Measured Bundle Size

| | Raw | Gzip | Brotli |
|-|-----|------|--------|
| All 6 components (IIFE bundle) | 84KB | 30KB | 27KB |
| Per-component (e.g. Button + Preact runtime) | ~12KB | ~5KB | ~4KB |
| React + ReactDOM alone (no components) | 140KB | 40KB | 36KB |

The IIFE bundle is larger than a minimal Preact app because PatternFly's Alert and Label components pull in transitive dependencies (Tooltip, icons). The per-component ESM build addresses this — consumers only pay for what they import, with the shared Preact runtime loaded once via a common chunk.

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

4. **Transitive dependencies inflate the bundle.** Alert and Label pull in Tooltip, which pulls in Popper-like positioning logic. The per-component ESM build mitigates this — consumers only load the dependencies of the components they actually import.

5. **The approach works.** Despite the above friction points, the components render correctly using the same PatternFly CSS, with Preact as a ~6KB drop-in replacement for React's ~40KB runtime.

---

## Devil's Advocate: Counterarguments and Responses

We stress-tested this approach against the strongest objections. Below is a summary of each counterargument, its validity, and how the POC addresses (or accepts) it.

### 1. "You've proven the easy part; the hard part is what matters"

**Argument:** Buttons and badges are trivial. Any approach works for leaf nodes. The real test is composition-heavy components (Select, Table, Wizard) — and the POC doesn't address those.

**Assessment: Strongest counterargument overall.** It's technically correct — atoms are easy. But:

- The POC's scope is *intentionally* bounded to atoms. The target audience (Drupal, vanilla JS, mixed-framework teams) genuinely needs consistent buttons, alerts, and badges — not a full widget toolkit.
- The "hard components" are equally hard in Lit. A Lit-native `<pf-select>` with keyboard navigation, filtering, and portals is a multi-month effort.
- The atom boundary is the strategy, not a gap. It should be communicated clearly to avoid organizational scope creep.

**Mitigation:** Define and communicate the "bridgeable tier" boundary explicitly. If demand pushes past it, that becomes evidence to justify the larger Lit investment — informed by real adoption data rather than speculation.

### 2. "Preact compatibility is an assumption, not a guarantee"

**Argument:** The entire strategy depends on `preact/compat` faithfully replicating React. One incompatibility in a transitive dependency could silently break a component, and Preact's small team may lag behind React's feature releases.

**Assessment: Moderate concern, practically mitigated.** Valid in theory, but:

- Atom-tier components use only basic React features (props, `forwardRef`, conditional classes). They don't use Context, Suspense, concurrent features, or anything on Preact's known-gap list.
- `preact/compat` has been battle-tested for years across `react-query`, `react-router`, `zustand`, and `@floating-ui/react`.
- The POC *already proved* it works — this isn't an assumption, it's a demonstrated result.
- If React 19+ introduces a feature that Preact doesn't support and PF adopts it in an atom, that one component is excluded until Preact catches up (historically 1–3 months).

**Mitigation:** CI tests run against Preact (already scaffolded). Per-component tests catch regressions immediately. If compat fails for a specific component, it can be rewritten natively in a few dozen lines without disrupting the rest.

### 3. "You're not delivering real web components"

**Argument:** These are React components wearing a custom element costume. They don't use Shadow DOM, slots, `ElementInternals`, or any native web component APIs. Consumers expecting "web components" will be disappointed.

**Assessment: Valid framing concern, but misidentifies the goal.** The goal isn't "produce spec-compliant web components" — it's "deliver PatternFly components to non-React consumers using native browser APIs." Custom elements *are* real web components; Shadow DOM is optional, not required.

- The components register via `customElements.define()`, work in any HTML page, and behave like native elements.
- Shadow DOM is intentionally omitted because PatternFly's CSS architecture is global/class-based, and light DOM lets React and WC consumers share one stylesheet.
- No consumer will care whether the internals use Preact or hand-rolled vanilla JS — they care about API, correctness, and bundle size.

### 4. "Light DOM doesn't solve the use case that wants web components"

**Argument:** Teams wanting web components often want *encapsulation*: style isolation so their components don't break in hostile CSS environments.

**Assessment: Partially valid, but doesn't match our target audience.** Our consumers are:

- Teams using PatternFly mixed with their own web components
- Drupal-based sites needing consistent UI atoms
- Pure HTML/CSS/vanilla JS projects

These teams already load PatternFly CSS globally. They don't need shadow encapsulation — they need consistent, pre-built elements that apply PF classes correctly. The BEM naming + `pf-v6-` prefix already provides practical isolation from accidental collisions.

**Mitigation:** If a specific consumer proves they need style isolation, individual components can be upgraded to Shadow DOM without changing the public API (`<pf-button>` stays the same regardless of internal implementation).

### 5. "The bundle will grow to an unacceptable size"

**Argument:** The POC is 30KB gzipped for 6 components. Extrapolate to 20–30 atoms and you're at 100KB+ — at which point, why not just ship React?

**Assessment: Valid concern, already addressed by tree-shaking.** The POC now supports per-component ESM entry points:

```javascript
// Only loads Button + shared Preact runtime (~8KB total)
import '@patternfly/patternfly-web-components/button';
```

The 30KB measurement is the all-at-once IIFE bundle. Per-component imports share a single Preact runtime chunk and load only the component code needed. Additionally, much of the 30KB comes from transitive dependencies (Tooltip, icons) that are only present in Alert/Label — simpler atoms are far smaller.

### 7. "The bridge IS the maintenance burden you're trying to avoid"

**Argument:** Every React component change (new prop, renamed prop, changed behavior) requires a corresponding bridge update. This is just wrapper maintenance by another name.

**Assessment: Partially valid, but the burden is proportional to scope.** The bridge for each component is 3–7 lines of declarative configuration:

```typescript
bridge(Button, 'pf-button', [
  attr('variant'), attr('size'), attr('type'),
  bool('isDisabled'), bool('isBlock'), bool('isLoading')
]);
```

Adding a new prop = adding one line. Per-component CI tests catch drift. Contrast this with a Lit rewrite where each component is 100–500 lines of *implementation* that must be kept in behavioral sync with the React version.

**Mitigation:** Per-component integration tests (already scaffolded) validate the attribute → prop → markup pipeline. A prop added to React but missing from the bridge doesn't break anything — it's simply unavailable to WC consumers until the bridge is updated.

### 8. "Testing burden doubles"

**Argument:** You now need to test every component twice — once in React, once as a web component.

**Assessment: Valid concern, but the actual burden is small.** The testing strategy is layered:

1. **Bridge utility tests** — validate `attr()`, `bool()`, and `bridge()` mechanics once.
2. **Per-component smoke tests** — a controlled stub verifies the attribute → prop → class-name pipeline (10–20 lines per component, not full integration tests).
3. **React tests still cover behavioral correctness** — the web component is just a delivery wrapper, not new logic.

The per-component tests don't duplicate React's behavioral tests. They verify the *contract* (given this attribute, the correct PF class appears in the DOM). This is closer to a thin integration check than a full test suite.

### 9. "Voorhoede proved this doesn't scale"

**Argument:** The cited industry examples use Preact + custom elements for small widgets (cookie bars, newsletter forms), not 80+ component design systems.

**Assessment: Partly valid but misapplied to our scope.** We're not wrapping 80 components — we're wrapping 10–15 atoms, which is the same complexity tier where this pattern is already proven. CMS.gov uses it for government design system infrastructure across multiple frameworks, which is closer to our use case than a cookie bar.

**Mitigation:** The scope boundary prevents this from becoming a scaling problem. If demand grows beyond atoms, that's the trigger to evaluate Lit — with real adoption data in hand.

### 10. "You might be optimizing for today's inertia, not tomorrow's direction"

**Argument:** The industry is moving toward web-components-first design systems. By keeping React as the source of truth, you're building toward a paradigm that may become less relevant. The strategic move might be WC-first with React wrappers, not the reverse.

**Assessment: The strongest *strategic* counterargument.** The industry trend is real (GitHub, Adobe, Microsoft, Salesforce have gone WC-first). However:

- A WC-first rewrite requires 12–24 months and multi-FTE investment before delivering value. The Preact approach delivers in weeks.
- If demand validates, the Preact wrappers become evidence to justify the larger investment.
- The approaches are sequential, not competing: ship atoms now → validate demand → invest in Lit if data supports it.
- Components can be migrated from Preact-wrapped to native WC *under the same custom element tags* without breaking consumers.

**Key framing:** The Preact-wrap approach isn't the long-term architecture — it's the cheapest way to de-risk the decision of whether to pursue one.

### Summary

| Counterargument | Severity | Status |
|----------------|----------|--------|
| Easy part proven, hard part unknown | High | Accepted — boundary is the strategy |
| Preact compat risk | Medium | Mitigated — CI tests + bounded API surface |
| Not "real" web components | Low | Reframed — custom elements are real WCs |
| Light DOM lacks encapsulation | Low | Accepted — not needed for target audience |
| Bundle size growth | Medium | Addressed — per-component tree-shaking |
| Bridge is maintenance burden | Medium | Mitigated — 3–7 lines per component + CI |
| Testing burden doubles | Medium | Addressed — layered test strategy, minimal per-component overhead |
| Voorhoede doesn't prove scale | Low | Reframed — scope matches proven tier |
| Optimizing for today's inertia | High (strategic) | Accepted — POC is a de-risking step, not a destination |

**Overall verdict:** No single counterargument invalidates the bounded POC strategy. The strongest objections (scope creep, strategic direction) are arguments for *discipline and clear communication*, not for abandoning the approach. The POC's value is in validating demand cheaply before committing to larger architectural bets.
