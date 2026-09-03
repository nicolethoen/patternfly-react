import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@patternfly/react-core';
import { bridgeFamily, attr, bool } from '../bridge';

bridgeFamily(Card, 'pf-card', [
  attr('variant'),
  bool('isCompact'),
  bool('isFullHeight'),
  bool('isPlain'),
  bool('isFlat'),
  bool('isRounded'),
  bool('isLarge')
], {
  'pf-card-header': { component: CardHeader, props: [] },
  'pf-card-title': { component: CardTitle, props: [] },
  'pf-card-body': { component: CardBody, props: [bool('isFilled')] },
  'pf-card-footer': { component: CardFooter, props: [] },
});
