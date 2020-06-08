import * as React from 'react';
import 'flatpickr/dist/themes/light.css';
import { Select, SelectOption, SelectOptionObject } from '../Select';

export interface DayOfWeekPickerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'value'> {
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
  onClick?: () => void;
  /** */
  onChange?: () => void;
  /** */
  onBlur?: () => void;
  /** */
  value?: string;
  /** */
  customOptions?: React.ReactElement[];
  /** */
  placeholderText?: string;
}

interface DayOfWeekPickerState {
  isDayOfWeekSelectOpen: boolean;
  dayOfWeekSelection: string | SelectOptionObject;
}

export class DayOfWeekPicker extends React.Component<DayOfWeekPickerProps, DayOfWeekPickerState> {
  static defaultProps = {
    className: 'pf-time-picker',
    invalidText: 'Invalid time format.',
    invalid: false,
    isDisabled: false,
    onChange: () => {},
    onClick: () => {},
    onBlur: () => {},
    label: '',
    value: '',
    customOptions: [] as string[],
    placeholderText: ''
  };

  constructor(props: DayOfWeekPickerProps) {
    super(props);
    this.state = {
      isDayOfWeekSelectOpen: false,
      dayOfWeekSelection: props.value
    }
  }

  toggleDayOfWeekSelect = (isOpen: boolean) => {
    this.setState({
      isDayOfWeekSelectOpen: isOpen
    })
  };

  onDayOfWeekSelect = (event: React.MouseEvent | React.ChangeEvent, value: string | SelectOptionObject) => {
    this.setState({
      isDayOfWeekSelectOpen: false,
      dayOfWeekSelection: value
    })
  };

  render () {
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
      customOptions,
      placeholderText,
      ...props } = this.props;

    const { dayOfWeekSelection, isDayOfWeekSelectOpen } = this.state;

    return (
      <div className={className} {...props}>
        { label && <label>{label}</label> }
          <Select
            isOpen={isDayOfWeekSelectOpen}
            onToggle={this.toggleDayOfWeekSelect}
            onSelect={this.onDayOfWeekSelect}
            selections={dayOfWeekSelection}
          >
            { customOptions.length ? (
              customOptions
            ) : ([
              <SelectOption key='placeholder' value={placeholderText} isPlaceholder />,
              <SelectOption key='Sunday' value='Sunday' />,
              <SelectOption key='Monday' value='Monday' />,
              <SelectOption key='Tuesday' value='Tuesday' />,
              <SelectOption key='Wednesday' value='Wednesday' />,
              <SelectOption key='Thursday' value='Thursday' />,
              <SelectOption key='Friday' value='Friday' />,
              <SelectOption key='Saturday' value='Saturday' />,
            ])}
          </Select>
        {invalid && <div className="error">{invalidText}</div>}
      </div>
    );
  }
}
