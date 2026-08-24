import { Alert } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Alert, 'pf-alert', [attr('variant'), attr('title'), bool('isInline'), bool('isPlain')]);
