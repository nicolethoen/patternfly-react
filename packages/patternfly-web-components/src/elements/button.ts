import { Button } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Button, 'pf-button', [
  attr('variant'),
  attr('size'),
  attr('type'),
  attr('aria-label'),
  bool('isDisabled'),
  bool('isBlock'),
  bool('isLoading')
]);
