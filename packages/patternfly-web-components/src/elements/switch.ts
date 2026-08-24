import { Switch } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Switch, 'pf-switch', [attr('label'), attr('aria-label'), attr('id'), bool('isChecked'), bool('isDisabled')]);
