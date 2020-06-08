import * as React from 'react';
import { RangeWrapperContext } from './DateTimePickerUtils';

export interface RangeWrapperProps extends Omit<React.HTMLProps<HTMLDivElement>, 'value'> {
  /** Additional classes added to the date time picker. */
  className?: string;
  /** */
  children?: React.ReactNode;
  /** Input label */
  label?: string;
  /** TODO */
  invalid?: boolean;
  /** TODO */
  invalidText?: string;
  /** TODO */
  minStartDate?: string;
  /** TODO */
  startDate?: string;
  /** TODO */
  maxEndDate?: string;
  /** TODO */
  endDate?: string;
}

interface RangeWrapperState {
  minStartDate: string;
  maxEndDate: string;
}

export class RangeWrapper extends React.Component<RangeWrapperProps, RangeWrapperState> {
  static defaultProps = {
    className: 'pf-c-date-picker',
    children: '',
    label: '',
    invalid: false,
    invalidText: 'Invalid date format.',
    minStartDate: '',
    maxEndDate: '',
    startDate: '',
    endDate: '',
  };

  constructor(props: RangeWrapperProps) {
    super(props);
    this.state = {
      maxEndDate: props.maxEndDate,
      minStartDate: props.minStartDate
    }
  }

  updateMinStartDate = (minStartDate: string) => {
    this.setState({minStartDate});
    console.log("minStartDate", minStartDate);
  };

  updateMaxEndDate = (maxEndDate: string) => {
    this.setState({maxEndDate});
    console.log("maxEndDate", maxEndDate);

  };

  render() {
    const {
      className,
      children,
      label,
      invalid,
      invalidText,
      ...props } = this.props;
    const { minStartDate, maxEndDate } = this.state;
    return (
      <RangeWrapperContext.Provider
        value={{
          minStartDate,
          maxEndDate,
          updateMinStartDate: this.updateMinStartDate,
          updateMaxEndDate: this.updateMaxEndDate
        }}
      >
        <div className={className} {...props}>
          {label && <label>{label}</label>}
          {children}
        </div>
        {invalid && <div className="error">{invalidText}</div>}
      </RangeWrapperContext.Provider>
    )
  }
}

