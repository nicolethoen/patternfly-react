import { Label } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Label, 'pf-label', [attr('color'), attr('variant'), attr('status'), bool('isCompact')]);
