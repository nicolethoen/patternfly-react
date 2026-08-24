import { describe, it, expect } from 'vitest';
import { h } from 'preact';
import { bridge, attr, bool } from '../src/bridge';

describe('bridge utility', () => {
  describe('attr()', () => {
    it('creates a pass-through PropDef with matching attr and prop names', () => {
      expect(attr('variant')).toEqual({ attr: 'variant', prop: 'variant' });
    });
  });

  describe('bool()', () => {
    it('lowercases the attribute name and sets boolean flag', () => {
      expect(bool('isDisabled')).toEqual({
        attr: 'isdisabled',
        prop: 'isDisabled',
        boolean: true
      });
    });

    it('handles already-lowercase prop names', () => {
      expect(bool('checked')).toEqual({
        attr: 'checked',
        prop: 'checked',
        boolean: true
      });
    });
  });

  describe('bridge()', () => {
    it('registers a custom element with the given tag name', () => {
      const Stub = () => h('span', null);
      bridge(Stub, 'test-bridge-register', [attr('variant')]);

      const el = document.createElement('test-bridge-register');
      document.body.appendChild(el);
      expect(customElements.get('test-bridge-register')).toBeDefined();
      document.body.removeChild(el);
    });

    it('maps string attributes to component props', async () => {
      let receivedProps: any = null;
      const Spy = (props: any) => {
        receivedProps = props;
        return h('span', null);
      };

      bridge(Spy, 'test-bridge-string', [attr('variant'), attr('size')]);

      const el = document.createElement('test-bridge-string');
      el.setAttribute('variant', 'primary');
      el.setAttribute('size', 'lg');
      document.body.appendChild(el);

      await new Promise((r) => setTimeout(r, 0));

      expect(receivedProps.variant).toBe('primary');
      expect(receivedProps.size).toBe('lg');
      document.body.removeChild(el);
    });

    it('coerces empty-string boolean attribute to true', async () => {
      let receivedProps: any = null;
      const Spy = (props: any) => {
        receivedProps = props;
        return h('span', null);
      };

      bridge(Spy, 'test-bridge-bool-true', [bool('isDisabled')]);

      const el = document.createElement('test-bridge-bool-true');
      el.setAttribute('isdisabled', '');
      document.body.appendChild(el);

      await new Promise((r) => setTimeout(r, 0));

      expect(receivedProps.isDisabled).toBe(true);
      document.body.removeChild(el);
    });

    it('coerces "false" boolean attribute to false', async () => {
      let receivedProps: any = null;
      const Spy = (props: any) => {
        receivedProps = props;
        return h('span', null);
      };

      bridge(Spy, 'test-bridge-bool-false', [bool('isDisabled')]);

      const el = document.createElement('test-bridge-bool-false');
      el.setAttribute('isdisabled', 'false');
      document.body.appendChild(el);

      await new Promise((r) => setTimeout(r, 0));

      expect(receivedProps.isDisabled).toBe(false);
      document.body.removeChild(el);
    });

    it('passes children through to the component', async () => {
      let receivedProps: any = null;
      const Spy = (props: any) => {
        receivedProps = props;
        return h('span', null, props.children);
      };

      bridge(Spy, 'test-bridge-children', []);

      const el = document.createElement('test-bridge-children');
      el.textContent = 'Hello';
      document.body.appendChild(el);

      await new Promise((r) => setTimeout(r, 0));

      expect(receivedProps.children).toBeDefined();
      document.body.removeChild(el);
    });
  });
});
