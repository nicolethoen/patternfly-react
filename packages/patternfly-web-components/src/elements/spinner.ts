import { Spinner } from '@patternfly/react-core';
import { bridge, attr, bool } from '../bridge';

bridge(Spinner, 'pf-spinner', [attr('size'), attr('aria-label'), bool('isInline')]);
