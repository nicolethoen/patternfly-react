# PatternFly Web Components Strategy: Executive Overview

## Proposal

Build a curated web components library (~25 components) using **light DOM + shared CSS** with the React implementation. Two parallel implementations, one visual system.

## Target Audience

**Web Components:** Documentation sites, marketing pages, CMS integrations, vanilla JS contexts, quick prototypes.

**React:** Full applications, complex interactions, data-heavy UIs.

Clear positioning: WCs for simple integrations, React for apps.

## Key Architecture Decisions

**Light DOM (no shadow DOM)**
- Enables shared CSS between React + WC implementations
- Same `pf-v6-*` classes, same tokens, same visual output
- One stylesheet, one visual QA surface
- No style injection complexity

**Shared CSS prevents visual drift** — biggest problem with two independent streams (web components with shadow DOM and React). Any CSS optimization or rewrite benefits both implementations simultaneously. Also preserves the powerful pure HTML/CSS implementation of PatternFly (no JS framework required). Theming and mixed-framework pages work seamlessly — React and WC components on the same page share the exact same stylesheet (classes, tokens, rules), guaranteeing pixel-perfect visual consistency.

**Parallel implementations, not bridge**
- React stays native React (no changes, 300+ consumers unaffected)
- WCs are real web components (Lit/vanilla, native APIs)
- No Preact abstraction layer
- Each uses natural patterns for its platform

## Scope: ~25 Components

**Tier 1 (atoms):** Button, Badge, Label, Alert, Banner, Icon, Spinner, Progress, Avatar, Chip, Switch, Checkbox, Radio, TextInput

**Tier 2 (compounds):** Card, Accordion, Tabs, Label Group, Breadcrumb

**Tier 3 (interactive):** Tooltip, Popover

**Out of scope:** Modal, Select, Dropdown, Wizard, Table, DatePicker, Form validation — use React for these.

## Effort & Timeline

**Initial build:** 2-4 months (vs 12-18 for full 80-component parity)

**Ongoing maintenance:** Dual maintenance for ~25 components (manageable) vs current PFE burden (80+ components, visual + API drift)

## Benefits

- Framework-agnostic delivery for integration use cases
- Visual consistency guaranteed (shared CSS)
- React consumers unchanged
- No multi-year rewrite commitment
- Can ship component-by-component
- Replaces PFE with smaller, more maintainable scope

## Risks

- **Dual maintenance** (mitigated: smaller scope, shared CSS)
- **Feature parity requires discipline** (mitigated: strict API alignment, shared test fixtures)
- **Limited component set** (accepted: clear "use React" guidance for complex components)
- **No style encapsulation** — consumer CSS can interfere with PF classes (e.g., aggressive resets). Light DOM tradeoff for CSS sharing. (mitigated: BEM naming + `pf-v6-*` prefix provides practical isolation; target audience already loads PF CSS correctly)
- **PFE migration path unclear** — existing PFE consumers using shadow DOM need migration strategy; timeline for maintaining both libraries TBD
- **Testing burden** — both React + WC implementations need testing (mitigated: shared visual regression tests, layered test strategy)
- **Adoption uncertainty** — demand for this specific subset unproven; PFE consumer migration unknown (mitigated: incremental shipping, feedback loops)

## vs Current State (PFE)

| Dimension | Current PFE | Proposed |
|-----------|-------------|----------|
| Component count | 80+ | ~25 |
| CSS system | Separate (`pf-v5-*`) | Shared (`pf-v6-*`) |
| DOM model | Shadow | Light |
| Visual drift risk | High | Low |
| Maintenance burden | High | Medium |

## Decision Point

Accept dual maintenance of ~25 components in exchange for framework-agnostic delivery + guaranteed visual consistency?
