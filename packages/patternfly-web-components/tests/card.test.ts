import { describe, it, expect, beforeAll } from 'vitest';
import { h } from 'preact';
import { bridgeFamily, attr, bool } from '../src/bridge';

/**
 * Per-component integration test: Card composition via bridgeFamily.
 *
 * Verifies that bridgeFamily correctly maps the DOM tree to a Preact
 * VNode tree, passing attributes as props to each component and
 * rendering the expected PF class names.
 */
describe('bridgeFamily: card composition', () => {
  let cardProps: Record<string, any>;
  let bodyProps: Record<string, any>;

  beforeAll(() => {
    cardProps = {};
    bodyProps = {};

    const StubCard = (props: any) => {
      cardProps = { ...props };
      const modifiers = [
        props.isCompact && 'pf-m-compact',
        props.isFullHeight && 'pf-m-full-height',
        props.isPlain && 'pf-m-plain',
        props.isFlat && 'pf-m-flat',
        props.isRounded && 'pf-m-rounded',
        props.isLarge && 'pf-m-display-lg'
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        'div',
        { class: `pf-v6-c-card${modifiers ? ` ${modifiers}` : ''}` },
        props.children
      );
    };

    const StubCardHeader = (props: any) => {
      return h('div', { class: 'pf-v6-c-card__header' }, props.children);
    };

    const StubCardTitle = (props: any) => {
      return h('div', { class: 'pf-v6-c-card__title' }, props.children);
    };

    const StubCardBody = (props: any) => {
      bodyProps = { ...props };
      const cls = `pf-v6-c-card__body${props.isFilled === false ? ' pf-m-no-fill' : ''}`;
      return h('div', { class: cls }, props.children);
    };

    const StubCardFooter = (props: any) => {
      return h('div', { class: 'pf-v6-c-card__footer' }, props.children);
    };

    bridgeFamily(StubCard, 'pf-test-family-card', [
      attr('variant'),
      bool('isCompact'),
      bool('isFullHeight'),
      bool('isPlain'),
      bool('isFlat'),
      bool('isRounded'),
      bool('isLarge')
    ], {
      'pf-test-family-card-header': { component: StubCardHeader, props: [] },
      'pf-test-family-card-title': { component: StubCardTitle, props: [] },
      'pf-test-family-card-body': { component: StubCardBody, props: [bool('isFilled')] },
      'pf-test-family-card-footer': { component: StubCardFooter, props: [] },
    });
  });

  const wait = () => new Promise((r) => setTimeout(r, 20));

  it('renders the card root with correct base class', async () => {
    const el = document.createElement('pf-test-family-card');
    document.body.appendChild(el);
    await wait();

    const card = el.querySelector('.pf-v6-c-card');
    expect(card).not.toBeNull();
    document.body.removeChild(el);
  });

  it('applies compact modifier from attribute', async () => {
    const el = document.createElement('pf-test-family-card');
    el.setAttribute('iscompact', '');
    document.body.appendChild(el);
    await wait();

    expect(cardProps.isCompact).toBe(true);

    const card = el.querySelector('.pf-v6-c-card')!;
    expect(card.getAttribute('class')).toContain('pf-m-compact');
    document.body.removeChild(el);
  });

  it('applies flat modifier', async () => {
    const el = document.createElement('pf-test-family-card');
    el.setAttribute('isflat', '');
    document.body.appendChild(el);
    await wait();

    expect(cardProps.isFlat).toBe(true);

    const card = el.querySelector('.pf-v6-c-card')!;
    expect(card.getAttribute('class')).toContain('pf-m-flat');
    document.body.removeChild(el);
  });

  it('renders child components with correct PF classes', async () => {
    const el = document.createElement('pf-test-family-card');
    el.innerHTML = `
      <pf-test-family-card-header>
        <pf-test-family-card-title>Title</pf-test-family-card-title>
      </pf-test-family-card-header>
      <pf-test-family-card-body>Body content</pf-test-family-card-body>
      <pf-test-family-card-footer>Footer</pf-test-family-card-footer>
    `;
    document.body.appendChild(el);
    await wait();

    expect(el.querySelector('.pf-v6-c-card')).not.toBeNull();
    expect(el.querySelector('.pf-v6-c-card__header')).not.toBeNull();
    expect(el.querySelector('.pf-v6-c-card__title')).not.toBeNull();
    expect(el.querySelector('.pf-v6-c-card__body')).not.toBeNull();
    expect(el.querySelector('.pf-v6-c-card__footer')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('maps child element attributes to React props', async () => {
    const el = document.createElement('pf-test-family-card');
    el.innerHTML = `<pf-test-family-card-body isfilled="false">Content</pf-test-family-card-body>`;
    document.body.appendChild(el);
    await wait();

    expect(bodyProps.isFilled).toBe(false);
    document.body.removeChild(el);
  });

  it('passes through regular HTML elements inside children', async () => {
    const el = document.createElement('pf-test-family-card');
    el.innerHTML = `
      <pf-test-family-card-body><p class="my-content">Hello</p></pf-test-family-card-body>
    `;
    document.body.appendChild(el);
    await wait();

    const p = el.querySelector('p.my-content');
    expect(p).not.toBeNull();
    expect(p?.textContent).toBe('Hello');
    document.body.removeChild(el);
  });

  it('renders text children correctly', async () => {
    const el = document.createElement('pf-test-family-card');
    el.innerHTML = `
      <pf-test-family-card-body>Simple text</pf-test-family-card-body>
    `;
    document.body.appendChild(el);
    await wait();

    const body = el.querySelector('.pf-v6-c-card__body');
    expect(body?.textContent).toBe('Simple text');
    document.body.removeChild(el);
  });

  it('re-renders when root attribute changes', async () => {
    const el = document.createElement('pf-test-family-card');
    document.body.appendChild(el);
    await wait();

    let card = el.querySelector('.pf-v6-c-card')!;
    expect(card.getAttribute('class')).not.toContain('pf-m-compact');

    el.setAttribute('iscompact', '');
    await wait();

    card = el.querySelector('.pf-v6-c-card')!;
    expect(card.getAttribute('class')).toContain('pf-m-compact');
    document.body.removeChild(el);
  });
});
