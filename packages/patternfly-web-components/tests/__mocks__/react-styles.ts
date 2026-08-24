/**
 * Mock for @patternfly/react-styles.
 * In tests, CSS module imports resolve to a proxy that returns
 * the property name as a string (so `styles.button` → "pf-v6-c-button" etc.).
 */
export function css(...args: any[]): string {
  return args.filter(Boolean).join(' ');
}

const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (prop === '__esModule') {
      return true;
    }
    if (prop === 'default') {
      return new Proxy({}, handler);
    }
    if (prop === 'css') {
      return css;
    }
    return String(prop);
  }
};

export default new Proxy({}, handler);
