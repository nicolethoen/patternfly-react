import * as React from 'react';
import moment, { Moment } from 'moment';
import 'flatpickr/dist/themes/light.css';
import { Select, SelectOption, SelectOptionObject } from '../Select';
import { getTimeSelectOptions } from './DateTimePickerUtils';

export interface TimePickerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'value'> {
  /** Additional classes added to the date time picker. */
  className?: string;
  /** Input label */
  label?: string;
  /** TODO */
  invalid?: boolean;
  /** TODO */
  invalidText?: string;
  /** */
  isDisabled?: boolean;
  /** */
  locale?: string;
  /** */
  pattern?: string;
  /** */
  maxLength?: number;
  /** */
  onClick?: () => void;
  /** */
  onChange?: () => void;
  /** */
  onBlur?: () => void;
  /** */
  hasAmPm?: boolean;
  /** */
  has24HrTime?: boolean;
  /** */
  hasHalfHours?: boolean;
  /** */
  hasTextInput?: boolean;
  /** */
  customTimeOptions?: React.ReactElement[];
  /** An ISO 8601 formatted date string */
  value?: string;
  /** */
  amPmSelection?: string;
}

interface TimePickerState {
  isAmPmSelectOpen: boolean;
  amPmSelection: string | Moment;
  isTimeSelectOpen: boolean;
  timeSelection: string | Moment;
}

export class TimePicker extends React.Component<TimePickerProps, TimePickerState> {
  static defaultProps = {
    className: 'pf-time-picker',
    placeholder: 'hh:mm',
    pattern: '(1[012]|[1-9]):[0-5][0-9](\\s)?',
    maxLength: 5,
    invalidText: 'Invalid time format.',
    invalid: false,
    isDisabled: false,
    onChange: () => {},
    onClick: () => {},
    onBlur: () => {},
    label: '',
    hasAmPm: false,
    hasTextInput: false,
    has24HrTime: false,
    hasHalfHours: false,
    customTimeOptions: [] as string[]
  };

  constructor(props: TimePickerProps) {
    super(props);
    try {
      const { value } = this.props;
      this.state = {
        isAmPmSelectOpen: false,
        amPmSelection: value ? moment(value, props.has24HrTime ? "HH:mm" : "hh:mm").format( "A"): 'AM',
        isTimeSelectOpen: false,
        timeSelection: value ? moment(value, props.has24HrTime ? "HH:mm" : "hh:mm").format(props.has24HrTime ? "HH:mm" : "hh:mm") : '',
      }
    } catch(err) {
      console.error("there was an issue parsing the provided time value", err)
    }
  }

  toggleAmPmSelect = (isOpen: boolean) => {
    this.setState({
      isAmPmSelectOpen: isOpen
    })
  };

  onAmPmSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    this.setState({
      isAmPmSelectOpen: false,
      amPmSelection: value.toString()
    })
  };

  toggleTimeSelect = (isOpen: boolean) => {
    this.setState({
      isTimeSelectOpen: isOpen
    })
  };

  onTimeSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    this.setState({
      isTimeSelectOpen: false,
      timeSelection: value.toString()
    })
  };

  render() {
    const {
      className,
      label,
      invalid,
      invalidText,
      placeholder,
      pattern,
      maxLength,
      isDisabled,
      onChange,
      onClick,
      hasAmPm,
      hasTextInput,
      customTimeOptions,
      has24HrTime,
      hasHalfHours,
      ...props } = this.props;

    const { isAmPmSelectOpen, amPmSelection, isTimeSelectOpen, timeSelection } = this.state;

    return (
      <div className={className} {...props}>
        { label && <label>{label}</label> }
        <div>
          { hasTextInput ? (
            <input placeholder={placeholder}
              aria-label="Time picker"
              maxLength={maxLength}
              disabled={isDisabled}
              pattern={pattern}
              value={timeSelection.toString()}
            />
          ) : (
            <Select
              isOpen={isTimeSelectOpen}
              onToggle={this.toggleTimeSelect}
              onSelect={this.onTimeSelect}
              selections={timeSelection}
            >
              { customTimeOptions.length ? (
                customTimeOptions
              ) : (
                getTimeSelectOptions(has24HrTime, hasHalfHours)
              )}
            </Select>
          )}
          { hasAmPm && (
            <Select
              isOpen={isAmPmSelectOpen}
              onToggle={this.toggleAmPmSelect}
              onSelect={this.onAmPmSelect}
              selections={amPmSelection}
            >
              <SelectOption key="am" value="AM"/>
              <SelectOption key="pm" value="PM"/>
            </Select>
          )}
        </div>
        {invalid && <div className="error">{invalidText}</div>}
      </div>
    );
  }
}
