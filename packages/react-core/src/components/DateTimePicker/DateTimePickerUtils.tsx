import * as React from 'react';
import { SelectOption } from '../Select';

interface RangeWrapperContextProps {
  /** TODO */
  minStartDate: string;
  /** TODO */
  maxEndDate: string;
  updateMinStartDate: (newStartDate: string) => void;
  updateMaxEndDate: (newEndDate: string) => void;
}

export const RangeWrapperContext = React.createContext<RangeWrapperContextProps>({
  minStartDate : '',
  maxEndDate: '',
  updateMinStartDate: minStartDate => {},
  updateMaxEndDate: maxEndDate => {}
});

export function getTimeSelectOptions(is24HourTime: boolean, hasHalfHours: boolean): React.ReactElement[] {
  if (is24HourTime) {
    if (hasHalfHours) {
      return ([
        <SelectOption key='placeholder' value='' isPlaceholder />,
        <SelectOption key='00:00' value='00:00' />,
        <SelectOption key='00:30' value='00:30' />,
        <SelectOption key='01:00' value='01:00' />,
        <SelectOption key='01:30' value='01:30' />,
        <SelectOption key='02:00' value='02:00' />,
        <SelectOption key='02:30' value='02:30' />,
        <SelectOption key='03:00' value='03:00' />,
        <SelectOption key='03:30' value='03:30' />,
        <SelectOption key='04:00' value='04:00' />,
        <SelectOption key='04:30' value='04:30' />,
        <SelectOption key='05:00' value='05:00' />,
        <SelectOption key='05:30' value='05:30' />,
        <SelectOption key='06:00' value='06:00' />,
        <SelectOption key='06:30' value='06:30' />,
        <SelectOption key='07:00' value='07:00' />,
        <SelectOption key='07:30' value='07:30' />,
        <SelectOption key='08:00' value='08:00' />,
        <SelectOption key='08:30' value='08:30' />,
        <SelectOption key='09:00' value='09:00' />,
        <SelectOption key='09:30' value='09:30' />,
        <SelectOption key='10:00' value='10:00' />,
        <SelectOption key='10:30' value='10:30' />,
        <SelectOption key='11:00' value='11:00' />,
        <SelectOption key='11:30' value='11:30' />,
        <SelectOption key='12:00' value='12:00' />,
        <SelectOption key='12:30' value='12:30' />,
        <SelectOption key='13:00' value='13:00' />,
        <SelectOption key='13:30' value='13:30' />,
        <SelectOption key='14:00' value='14:00' />,
        <SelectOption key='14:30' value='14:30' />,
        <SelectOption key='15:00' value='15:00' />,
        <SelectOption key='15:30' value='15:30' />,
        <SelectOption key='16:00' value='16:00' />,
        <SelectOption key='16:30' value='16:30' />,
        <SelectOption key='17:00' value='17:00' />,
        <SelectOption key='17:30' value='17:30' />,
        <SelectOption key='18:00' value='18:00' />,
        <SelectOption key='18:30' value='18:30' />,
        <SelectOption key='19:00' value='19:00' />,
        <SelectOption key='19:30' value='19:30' />,
        <SelectOption key='20:00' value='20:00' />,
        <SelectOption key='20:30' value='20:30' />,
        <SelectOption key='21:00' value='21:00' />,
        <SelectOption key='21:30' value='21:30' />,
        <SelectOption key='22:00' value='22:00' />,
        <SelectOption key='22:30' value='22:30' />,
        <SelectOption key='23:00' value='23:00' />,
        <SelectOption key='23:30' value='23:30' />
      ]);
    } else {
      return ([
        <SelectOption key='placeholder' value='' isPlaceholder />,
        <SelectOption key='00:00' value='00:00' />,
        <SelectOption key='01:00' value='01:00' />,
        <SelectOption key='02:00' value='02:00' />,
        <SelectOption key='03:00' value='03:00' />,
        <SelectOption key='04:00' value='04:00' />,
        <SelectOption key='05:00' value='05:00' />,
        <SelectOption key='06:00' value='06:00' />,
        <SelectOption key='07:00' value='07:00' />,
        <SelectOption key='08:00' value='08:00' />,
        <SelectOption key='09:00' value='09:00' />,
        <SelectOption key='10:00' value='10:00' />,
        <SelectOption key='11:00' value='11:00' />,
        <SelectOption key='12:00' value='12:00' />,
        <SelectOption key='13:00' value='13:00' />,
        <SelectOption key='14:00' value='14:00' />,
        <SelectOption key='15:00' value='15:00' />,
        <SelectOption key='16:00' value='16:00' />,
        <SelectOption key='17:00' value='17:00' />,
        <SelectOption key='18:00' value='18:00' />,
        <SelectOption key='19:00' value='19:00' />,
        <SelectOption key='20:00' value='20:00' />,
        <SelectOption key='21:00' value='21:00' />,
        <SelectOption key='22:00' value='22:00' />,
        <SelectOption key='23:00' value='23:00' />,
      ]);
    }
  } else {
    if (hasHalfHours) {
      return ([
        <SelectOption key='placeholder' value='' isPlaceholder />,
        <SelectOption key='01:00' value="01:00" />,
        <SelectOption key='01:30' value="01:30" />,
        <SelectOption key='02:00' value="02:00" />,
        <SelectOption key='02:30' value="02:30" />,
        <SelectOption key='03:00' value="03:00" />,
        <SelectOption key='03:30' value="03:30" />,
        <SelectOption key='04:00' value="04:00" />,
        <SelectOption key='04:30' value="04:30" />,
        <SelectOption key='05:00' value="05:00" />,
        <SelectOption key='05:30' value="05:30" />,
        <SelectOption key='06:00' value="06:00" />,
        <SelectOption key='06:30' value="06:30" />,
        <SelectOption key='07:00' value="07:00" />,
        <SelectOption key='07:30' value="07:30" />,
        <SelectOption key='08:00' value="08:00" />,
        <SelectOption key='08:30' value="08:30" />,
        <SelectOption key='09:00' value="09:00" />,
        <SelectOption key='09:30' value="09:30" />,
        <SelectOption key='10:00' value="10:00" />,
        <SelectOption key='10:30' value="10:30" />,
        <SelectOption key='11:00' value="11:00" />,
        <SelectOption key='11:30' value="11:30" />,
        <SelectOption key='12:00' value="12:00" />,
        <SelectOption key='12:30' value="12:30" />
      ]);
    } else {
      return ([
        <SelectOption key='placeholder' value='' isPlaceholder />,
        <SelectOption key='01:00' value='01:00' />,
        <SelectOption key='02:00' value='02:00' />,
        <SelectOption key='03:00' value='03:00' />,
        <SelectOption key='04:00' value='04:00' />,
        <SelectOption key='05:00' value='05:00' />,
        <SelectOption key='06:00' value='06:00' />,
        <SelectOption key='07:00' value='07:00' />,
        <SelectOption key='08:00' value='08:00' />,
        <SelectOption key='09:00' value='09:00' />,
        <SelectOption key='10:00' value='10:00' />,
        <SelectOption key='11:00' value='11:00' />,
        <SelectOption key='12:00' value='12:00' />
      ]);
    }
  }
}
