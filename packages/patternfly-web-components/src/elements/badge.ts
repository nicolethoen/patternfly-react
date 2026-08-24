import { Badge } from '@patternfly/react-core';
import { bridge, bool } from '../bridge';

bridge(Badge, 'pf-badge', [bool('isRead')]);
