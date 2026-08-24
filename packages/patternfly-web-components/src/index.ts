/**
 * PatternFly Web Components
 *
 * Usage:
 *   <script src="pf-elements.iife.js"></script>
 *   <link rel="stylesheet" href="patternfly.css">
 *   <pf-button variant="primary">Click me</pf-button>
 */

import { h } from 'preact';
import register from 'preact-custom-element';
import { Button, Badge, Label, Spinner, Alert, Switch } from '@patternfly/react-core';

interface PropDef {
  attr: string; // lowercase HTML attribute name
  prop: string; // camelCase React prop name
  boolean?: boolean; // whether to coerce to boolean
}

/**
 * Wraps a component to map lowercase HTML attributes to camelCase React props
 * and coerce boolean attributes (present = true, absent = false).
 */
function bridge(Component: any, propDefs: PropDef[]) {
  function Bridged(props: any) {
    const mapped: any = {};
    for (const def of propDefs) {
      if (def.attr in props) {
        const val = props[def.attr];
        mapped[def.prop] = def.boolean ? val !== null && val !== 'false' : val;
      }
    }
    return h(Component, { ...mapped, children: props.children });
  }

  const attrs = propDefs.map((d) => d.attr);
  register(Bridged, Component._tagName, attrs, { shadow: false });
}

function attr(name: string): PropDef {
  return { attr: name, prop: name };
}
function bool(prop: string): PropDef {
  return { attr: prop.toLowerCase(), prop, boolean: true };
}

// --- Button ---
(Button as any)._tagName = 'pf-button';
bridge(Button, [
  attr('variant'),
  attr('size'),
  attr('type'),
  attr('aria-label'),
  bool('isDisabled'),
  bool('isBlock'),
  bool('isLoading')
]);

// --- Badge ---
(Badge as any)._tagName = 'pf-badge';
bridge(Badge, [bool('isRead')]);

// --- Label ---
(Label as any)._tagName = 'pf-label';
bridge(Label, [attr('color'), attr('variant'), attr('status'), bool('isCompact')]);

// --- Spinner ---
(Spinner as any)._tagName = 'pf-spinner';
bridge(Spinner, [attr('size'), attr('aria-label'), bool('isInline')]);

// --- Alert ---
(Alert as any)._tagName = 'pf-alert';
bridge(Alert, [attr('variant'), attr('title'), bool('isInline'), bool('isPlain')]);

// --- Switch ---
(Switch as any)._tagName = 'pf-switch';
bridge(Switch, [attr('label'), attr('aria-label'), attr('id'), bool('isChecked'), bool('isDisabled')]);
