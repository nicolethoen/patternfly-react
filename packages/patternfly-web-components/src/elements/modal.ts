/**
 * Modal — BOUNDARY EXAMPLE (not bridgeable)
 *
 * This file documents why Modal cannot be cleanly delivered via the
 * Preact bridge approach. It exists as a reference, not a working element.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A naive bridge would look like:
 *
 *   bridge(Modal, 'pf-modal', [
 *     attr('variant'),
 *     attr('aria-label'),
 *     bool('isopen'),
 *   ]);
 *
 * This fails for the following reasons:
 *
 * 1. PORTALS
 *    Modal renders its content to document.body via ReactDOM.createPortal.
 *    The custom element's light DOM children are never used — content
 *    appears outside the <pf-modal> tag entirely. This breaks the mental
 *    model of "custom element wraps its content."
 *
 * 2. CALLBACK PROPS (onClose, onEscapePress)
 *    HTML attributes are strings. There's no way to pass a JavaScript
 *    function via an attribute. The bridge pattern works for data props
 *    (strings, booleans) but has no mechanism for event callbacks.
 *    A workaround (dispatching CustomEvents) would require additional
 *    bridge infrastructure beyond the current attr/bool model.
 *
 * 3. FOCUS TRAP
 *    Modal wraps content in a FocusTrap component that manages keyboard
 *    focus on mount/unmount. This depends on React's lifecycle (useEffect,
 *    componentDidMount) and cannot be triggered by attribute changes alone.
 *
 * 4. BODY SIDE EFFECTS
 *    Modal manipulates document.body classes and sets aria-hidden on
 *    sibling elements. This lifecycle management assumes React's
 *    mount/unmount semantics, not custom element connectedCallback.
 *
 * 5. MULTI-MODAL STACKING
 *    Modal maintains a static Map of open instances to coordinate
 *    stacking order and aria-hidden. Multiple <pf-modal> elements would
 *    each instantiate their own React tree with no shared state.
 *
 * 6. CONTROLLED STATE
 *    Modal's visibility is controlled by an `isOpen` prop + `onClose`
 *    callback. In React, the parent owns this state. In a custom element,
 *    toggling an `isopen` attribute could trigger rendering, but there's
 *    no way for the element to "request" closing (e.g., on Escape or
 *    backdrop click) without a callback — requiring imperative JS from
 *    the consumer regardless.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *
 * VERDICT: Modal requires a purpose-built web component implementation
 * (native <dialog>, focus-trap-region, event dispatching) rather than a
 * thin bridge over the React component. This is the type of component
 * that would justify a Lit/vanilla implementation if demand exists.
 *
 * Alternatively, consumers needing a modal in vanilla HTML can use the
 * native <dialog> element with PatternFly CSS classes applied manually:
 *
 *   <dialog class="pf-v6-c-modal-box">
 *     <header class="pf-v6-c-modal-box__header">...</header>
 *     <div class="pf-v6-c-modal-box__body">...</div>
 *     <footer class="pf-v6-c-modal-box__footer">...</footer>
 *   </dialog>
 *
 * This gives them PatternFly styling with native browser focus/backdrop
 * behavior, without needing Preact at all.
 */
