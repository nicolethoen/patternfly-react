import * as React from 'react';
import 'flatpickr/dist/themes/light.css';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { TimezonePicker} from './TimezonePicker';

export interface DateTimePickerProps extends React.HTMLProps<HTMLDivElement> {
  /** Additional classes added to the date time picker. */
  className?: string;
  /** Input label */
  label?: string;
  /** TODO */
  invalid?: boolean;
  /** TODO */
  invalidText?: string;
  /** */
  value?: string;
  /** */
  hasTextInput?: boolean;
  /** */
  hasAmPm?: boolean;
  /** */
  timezone?: string;
  /** */
  isStartDate?: boolean;
  /** */
  isEndDate?: boolean
}

export class DateTimePicker extends React.Component<DateTimePickerProps> {
  static defaultProps = {
    className: 'pf-c-date-time-picker',
    label: '',
    invalid: false,
    invalidText: '',
    value: '',
    hasTextInput: false,
    hasAmPm: false,
    timezone: '',
    isStartDate: false,
    isEndDate: false
  };

  render () {
    const { className, label, invalid, invalidText, value, hasTextInput, timezone, hasAmPm, isStartDate, isEndDate, ...props } = this.props;

    return (
      <div className={className} {...props}>
        <label>{label}</label>
        <div>
          <DatePicker value={value} isStartDate={isStartDate} isEndDate={isEndDate}/>
          <TimePicker value={value} hasTextInput={hasTextInput} hasAmPm={hasAmPm}/>
          <TimezonePicker value={timezone}/>
        </div>
        {invalid && <div className="error">{invalidText}</div>}
      </div>
    );
  }
}
