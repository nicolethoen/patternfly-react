---
title: 'DateTimePicker'
section: components
cssPrefix: 'pf-c-date-time-picker'
typescript: true
propComponents: ['DateTimePicker', 'DatePicker', 'TimePicker', 'DayOfWeekPicker', 'RangeWrapper']
---
import { DateTimePicker, DatePicker, DayOfWeekPicker, TimePicker, RangeWrapper } from '@patternfly/react-core';

## Examples
```js title=Basic-date-picker
import React from 'react';
import { DatePicker } from '@patternfly/react-core';

SimpleDatePicker = () => (
  <React.Fragment>
    <DatePicker label="Choose a date" value="2020-03-05"/>
    <DatePicker label="Choose a date" minDate="2020-03-01" maxDate="2020-03-20"/>
  </React.Fragment>
);
```

```js title=Basic-time-picker
import React from 'react';
import { TimePicker } from '@patternfly/react-core';

SimpleTimePicker = () => (
  <React.Fragment>
    <TimePicker label="Choose a time" hasAmPm hasTextInput />
    <TimePicker label="Choose a time" value="10:00" hasHalfHours />
  </React.Fragment>
);
```


```js title=Day-of-week-picker
import React from 'react';
import { DayOfWeekPicker, TimePicker } from '@patternfly/react-core';

SimpleDayOfWeekPicker = () => (
  <React.Fragment>
    <DayOfWeekPicker label="Run the job every "/>
    <TimePicker label=" at " hasHalfHours />
  </React.Fragment>
);
```
```js title=Basic-date-picker
import React from 'react';
import { DatePicker } from '@patternfly/react-core';

class ToolbarItems extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDateTime: "2013-02-08T12:00+09:00"
    }
    
    this.onChange = () => {
      
    }
  }

  render() {
    return (
      <>
        <DateTimePicker label="Choose a date" value={this.state.currentDateTime} hasTextInput hasAmPm onChange={this.onChange}/>
      </>
    )
  }
};
```
```js title=Basic-range
import React from 'react';
import { DatePicker, RangeWrapper } from '@patternfly/react-core';

SimpleRange = () => (
  <RangeWrapper>
    <DatePicker label="Choose a date" value="2020-03-05" isStartDate/>
    <DatePicker label="Choose a date" isEndDate/>
  </RangeWrapper>
);
```
