import * as React from 'react';
import { CalendarIcon } from '@patternfly/react-icons';
import flatpickr  from 'flatpickr';
import l10n from 'flatpickr/dist/l10n/index';
import { Button } from '../Button';
import 'flatpickr/dist/themes/light.css';
import { RangeWrapperContext } from './DateTimePickerUtils';

export interface DatePickerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'value' | 'onChange'> {
  /** Additional classes added to the date time picker. */
  className?: string;
  /** Input label */
  label?: string;
  /** TODO */
  invalid?: boolean;
  /** TODO */
  invalidText?: string;
  /** The minimum date that a user can start picking from. */
  minDate?: string;
  /** The maximum date that a user can pick to. */
  maxDate?: string;
  /** TODO */
  dateFormat?: string;
  /** */
  isDisabled?: boolean;
  /** */
  locale?: string;
  /** */
  pattern?: string;
  /** */
  placeholder?: string;
  /** Provide a function to be called when the input field is clicked */
  onClick?: () => void;
  /** Specify an `onChange` handler that is called whenever a change in the input field has occurred */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** An ISO 8601 formatted date string */
  value?: string;
  /** */
  isStartDate?: boolean;
  /** */
  isEndDate?: boolean
}

export class DatePicker extends React.Component<DatePickerProps> {
  static contextType: any = RangeWrapperContext;
  static defaultProps = {
    className: 'pf-c-date-picker',
    label: '',
    invalid: false,
    invalidText: 'Invalid date format.',
    minDate: '',
    maxDate: '',
    dateFormat: 'm/d/Y',
    isDisabled: false,
    locale: 'en',
    pattern: '\d{1,2}\/\d{1,2}\/\d{4}',
    placeholder: 'mm/dd/yyyy',
    onClick: () => {},
    onChange: () => {},
    value: '',
    isStartDate: false,
    isEndDate: false
  };

  private inputEl = React.createRef<HTMLInputElement>();
  private calendar: any = null;

  componentDidMount() {
    const { dateFormat, minDate, maxDate, locale, value, isEndDate, isStartDate, onChange } = this.props;
    const { minStartDate, maxEndDate, updateMaxEndDate, updateMinStartDate } = this.context;

    if (isEndDate && value) {
      updateMaxEndDate(value);
    }
    if (isStartDate && value) {
      updateMinStartDate(value);
    }

    this.calendar = flatpickr(this.inputEl.current, {
      dateFormat: dateFormat,
      locale: (l10n as any)[locale],
      minDate: isEndDate ? minStartDate : (minDate ? new Date(minDate) : ''),
      maxDate: isStartDate? maxEndDate : (maxDate ? new Date(maxDate) : ''),
      defaultDate: value ? new Date(value) : '',
      onChange: function(selectedDates, dateStr, instance) {
        console.log(dateStr);
        if (isEndDate) {
          updateMaxEndDate(value);
        }
        if (isStartDate) {
          updateMinStartDate(value);
        }
      }
    });
  }

  toggleCalendar = () => {
    this.props.onClick();
    this.calendar && this.calendar.isOpen ? this.calendar.open() : this.calendar.close();
  };

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {

  };

  render () {
    const {
      className,
      label,
      invalid,
      invalidText,
      placeholder,
      pattern,
      isDisabled,
      onChange,
      value,
      ...props } = this.props;

    return (
      <div className={className} {...props}>
        { label && <label>{label}</label> }
        <div>
          <input
            onChange={this.onChange}
            onClick={this.toggleCalendar}
            placeholder={placeholder}
            pattern={pattern}
            type="text"
            disabled={isDisabled}
            ref={this.inputEl}
          />
          <Button variant="plain" onClick={this.toggleCalendar}>
            <CalendarIcon />
          </Button>
        </div>
        {invalid && <div className="error">{invalidText}</div>}
      </div>
    );
  }
}
