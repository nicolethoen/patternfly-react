import { describe, it, expect, beforeAll } from 'vitest';
import { h } from 'preact';
import { bridge, attr, bool } from '../src/bridge';

/**
 * Per-component integration test example.
 *
 * Uses a controlled stub component to verify that the bridge
 * correctly delivers attribute values as props to the rendered output.
 * This proves the attribute → prop → markup pipeline works without
 * depending on PatternFly's CSS module infrastructure.
 */
describe('per-component integration: button pattern', () => {
  let receivedProps: Record<string, any>;

  beforeAll(() => {
    receivedProps = {};

    const StubButton = (props: any) => {
      receivedProps = { ...props };
      return h(
        'button',
        {
          class: `pf-v6-c-button${props.variant ? ` pf-m-${props.variant}` : ''}${props.isBlock ? ' pf-m-block' : ''}`,
          disabled: props.isDisabled || undefined,
          type: props.type || 'button'
        },
        h('span', { class: 'pf-v6-c-button__text' }, props.children)
      );
    };

    bridge(StubButton, 'pf-test-button', [
      attr('variant'),
      attr('size'),
      attr('type'),
      bool('isDisabled'),
      bool('isBlock'),
      bool('isLoading')
    ]);
  });

  it('renders a button element', async () => {
    const el = document.createElement('pf-test-button');
    el.textContent = 'Click me';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(el.querySelector('button')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('passes variant attribute as variant prop', async () => {
    const el = document.createElement('pf-test-button');
    el.setAttribute('variant', 'primary');
    el.textContent = 'Primary';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedProps.variant).toBe('primary');

    const button = el.querySelector('button')!;
    expect(button.getAttribute('class')).toContain('pf-m-primary');
    document.body.removeChild(el);
  });

  it('passes different variant values correctly', async () => {
    const el = document.createElement('pf-test-button');
    el.setAttribute('variant', 'danger');
    el.textContent = 'Danger';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedProps.variant).toBe('danger');

    const button = el.querySelector('button')!;
    expect(button.getAttribute('class')).toContain('pf-m-danger');
    document.body.removeChild(el);
  });

  it('coerces isdisabled attribute to boolean true', async () => {
    const el = document.createElement('pf-test-button');
    el.setAttribute('isdisabled', '');
    el.textContent = 'Disabled';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedProps.isDisabled).toBe(true);

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    document.body.removeChild(el);
  });

  it('does not disable when isdisabled is absent', async () => {
    const el = document.createElement('pf-test-button');
    el.textContent = 'Enabled';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedProps.isDisabled).toBeUndefined();

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(false);
    document.body.removeChild(el);
  });

  it('coerces isblock attribute to boolean and renders block class', async () => {
    const el = document.createElement('pf-test-button');
    el.setAttribute('isblock', '');
    el.textContent = 'Block';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    expect(receivedProps.isBlock).toBe(true);

    const button = el.querySelector('button')!;
    expect(button.getAttribute('class')).toContain('pf-m-block');
    document.body.removeChild(el);
  });

  it('renders children as text content', async () => {
    const el = document.createElement('pf-test-button');
    el.textContent = 'Hello World';
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 10));

    const text = el.querySelector('.pf-v6-c-button__text');
    expect(text?.textContent).toBe('Hello World');
    document.body.removeChild(el);
  });
});
