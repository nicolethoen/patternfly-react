import { h } from 'preact';
import register from 'preact-custom-element';

export interface PropDef {
  attr: string;
  prop: string;
  boolean?: boolean;
}

/**
 * Wraps a component to map lowercase HTML attributes to camelCase React props
 * and coerce boolean attributes (present = true, absent = false).
 *
 * Registers the resulting wrapper as a Custom Element.
 */
export function bridge(Component: any, tagName: string, propDefs: PropDef[]) {
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
  register(Bridged, tagName, attrs, { shadow: false });
}

/** Pass-through string attribute (no transformation). */
export function attr(name: string): PropDef {
  return { attr: name, prop: name };
}

/** Boolean attribute: presence/empty string → true, absent/"false" → false. */
export function bool(prop: string): PropDef {
  return { attr: prop.toLowerCase(), prop, boolean: true };
}
