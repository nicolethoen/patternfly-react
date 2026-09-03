import { h, render } from 'preact';
import register from 'preact-custom-element';

export interface PropDef {
  attr: string;
  prop: string;
  boolean?: boolean;
}

export interface ChildDef {
  component: any;
  props: PropDef[];
}

/**
 * Wraps a component to map lowercase HTML attributes to camelCase React props
 * and coerce boolean attributes (present = true, absent = false).
 *
 * Registers the resulting wrapper as a Custom Element.
 * Use for leaf components (no nested custom element children).
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

/**
 * Registers a compound component family as custom elements.
 * The root element owns a single Preact render tree that maps child
 * custom element tags to their corresponding React components.
 *
 * Use for components with nested custom element children (Card, Accordion, etc.)
 * where independent preact-custom-element renders would conflict.
 */
export function bridgeFamily(
  RootComponent: any,
  rootTag: string,
  rootProps: PropDef[],
  children: Record<string, ChildDef>
) {
  const childMap = new Map(Object.entries(children));

  function mapAttrs(element: Element, propDefs: PropDef[]): Record<string, any> {
    const mapped: Record<string, any> = {};
    for (const def of propDefs) {
      const raw = element.getAttribute(def.attr);
      if (raw !== null) {
        mapped[def.prop] = def.boolean ? raw !== 'false' : raw;
      }
    }
    return mapped;
  }

  function domToVdom(node: Node): any {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const childDef = childMap.get(tag);

    if (childDef) {
      const props = mapAttrs(el, childDef.props);
      const childNodes = [...el.childNodes].map(domToVdom).filter((v) => v != null && v !== '');
      return h(childDef.component, props, ...childNodes);
    }

    // Custom elements not in the family map are opaque — they manage
    // their own rendering via connectedCallback. Only capture attributes
    // and text content (not their rendered element structure).
    if (tag.includes('-')) {
      const htmlProps: Record<string, string> = {};
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        htmlProps[a.name] = a.value;
      }
      const text = el.textContent?.trim();
      return h(tag, htmlProps, text || undefined);
    }

    // Regular HTML elements — descend normally
    const htmlProps: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (a.name === 'class') {
        htmlProps.className = a.value;
      } else {
        htmlProps[a.name] = a.value;
      }
    }
    const childNodes = [...el.childNodes].map(domToVdom).filter((v) => v != null && v !== '');
    return h(tag, htmlProps, ...childNodes);
  }

  class FamilyRoot extends HTMLElement {
    static observedAttributes = rootProps.map((d) => d.attr);
    private _childVnodes: any[] = [];
    private _initialized = false;

    connectedCallback() {
      queueMicrotask(() => {
        this._childVnodes = [...this.childNodes].map(domToVdom).filter((v) => v != null && v !== '');
        this.textContent = '';
        this._initialized = true;
        this._render();
      });
    }

    attributeChangedCallback() {
      if (this._initialized) {
        queueMicrotask(() => this._render());
      }
    }

    disconnectedCallback() {
      render(null, this);
    }

    _render() {
      const props = mapAttrs(this, rootProps);
      render(h(RootComponent, props, ...this._childVnodes), this);
    }
  }

  // Register child tags first as empty custom elements so the browser
  // recognizes them before the root element's connectedCallback reads them.
  for (const tag of childMap.keys()) {
    customElements.define(tag, class extends HTMLElement {});
  }

  customElements.define(rootTag, FamilyRoot);
}

/** Pass-through string attribute (no transformation). */
export function attr(name: string): PropDef {
  return { attr: name, prop: name };
}

/** Boolean attribute: presence/empty string → true, absent/"false" → false. */
export function bool(prop: string): PropDef {
  return { attr: prop.toLowerCase(), prop, boolean: true };
}
