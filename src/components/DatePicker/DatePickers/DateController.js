import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import DatePicker from './DatePicker';

import css from './DateRangePicker.module.css';
import { getISODateString, getStartOfDay } from './DatePicker.helpers';

const dateFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export const DateController = props => {
  const intl = useIntl();
  const [selectedDate, setSelectedDate] = useState(props.value || null);
  const [rawValue, setRawValue] = useState(
    props.value ? intl.formatDate(props.value, dateFormatOptions) : ''
  );
  const element = useRef(null);

  const { className, rootClassName, formId = '', onChange, value, ...rest } = props;

  const id = `${formId}_DatePicker`;
  const classes = classNames(rootClassName || css.root, className);

  const handleChange = value => {
    if (!(value instanceof Date)) {
      return;
    }

    const cleanedValue = getStartOfDay(value);
    setSelectedDate(cleanedValue);
    setRawValue(intl.formatDate(cleanedValue, dateFormatOptions));

    if (onChange) {
      onChange(cleanedValue);
    }
  };

  return (
    <div id={id} className={classes} ref={element}>
      <DatePicker
        range={false}
        showMonthStepper={true}
        onChange={handleChange}
        value={selectedDate}
        {...rest}
      />
    </div>
  );
};

export default DateController;