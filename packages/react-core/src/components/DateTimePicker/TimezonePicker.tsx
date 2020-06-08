import * as React from 'react';
import 'flatpickr/dist/themes/light.css';
import moment from 'moment-timezone';
import { Select, SelectOption, SelectOptionObject, SelectVariant } from '../Select';
import { DayOfWeekPickerProps } from './DayOfWeekPicker';

export interface TimezonePickerProps extends React.HTMLProps<HTMLDivElement> {
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
}

interface TimezonePickerState {
  isTimezoneSelectOpen: boolean;
  timezoneSelection: string | SelectOptionObject;
}

export class TimezonePicker extends React.Component<TimezonePickerProps, TimezonePickerState> {
  static defaultProps = {
    className: 'pf-c-date-time-picker',
    label: '',
    invalid: false,
    invalidText: '',
    value: moment.tz.guess()
  };

  constructor(props: DayOfWeekPickerProps) {
    super(props);
    this.state = {
      isTimezoneSelectOpen: false,
      timezoneSelection: props.value
    }
  }

  toggleTimezoneSelect = (isOpen: boolean) => {
    this.setState({
      isTimezoneSelectOpen: isOpen
    })
  };

  onTimezoneSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    this.setState({
      isTimezoneSelectOpen: false,
      timezoneSelection: value
    })
  };

  render () {
    const { className, label, invalid, invalidText, value, ...props } = this.props;
    const { isTimezoneSelectOpen, timezoneSelection } = this.state;
    const timezones = moment.tz.names();
    return (
      <div className={className} {...props}>
        <label>{label}</label>
        <Select
          variant={SelectVariant.typeahead}
          isOpen={isTimezoneSelectOpen}
          onToggle={this.toggleTimezoneSelect}
          onSelect={this.onTimezoneSelect}
          selections={timezoneSelection}
        >
          {timezones.map((timezone, index) => (
            <SelectOption key={index} value={timezone} />
          ))}
        </Select>
        {invalid && <div className="error">{invalidText}</div>}
      </div>
    );
  }
}
