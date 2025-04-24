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

export const DateRangeController = props => {
  const intl = useIntl();
  const [dateRange, setDateRange] = useState(props.value || null);
  const [rawValues, setRawValues] = useState(
    props.value ? props.value.map(value => intl.formatDate(value, dateFormatOptions)) : ['', '']
  );
  const element = useRef(null);

  const {
    className,
    rootClassName,
    formId = '',
    isBlockedBetween,
    onChange,
    value,
    ...rest
  } = props;

  const id = `${formId}_DateRangePicker`;
  const classes = classNames(rootClassName || css.root, className);
  const startDateMaybe =
    Array.isArray(dateRange) && dateRange[0] instanceof Date && !isNaN(dateRange[0])
      ? { startDate: getISODateString(dateRange[0]) }
      : {};

  const handleChange = value => {
    if (!Array.isArray(value)) {
      return;
    }

    const cleanedValues = value.map(d => getStartOfDay(d));
    setDateRange(cleanedValues);

    // Special case for single-date selection (when both dates are the same)
    if (cleanedValues.length === 2 && 
        cleanedValues[0] instanceof Date && 
        cleanedValues[1] instanceof Date && 
        cleanedValues[0].getTime() === cleanedValues[1].getTime()) {
      // Only format the date once since it's the same date
      const formattedDate = intl.formatDate(cleanedValues[0], dateFormatOptions);
      setRawValues([formattedDate, formattedDate]);
      
      if (onChange) {
        onChange(cleanedValues);
      }
    } else if (cleanedValues.length === 1) {
      setRawValues([intl.formatDate(cleanedValues[0], dateFormatOptions), '']);
      if (onChange) {
        onChange(cleanedValues);
      }
    } else if (cleanedValues.length === 2) {
      setRawValues(cleanedValues.map(value => intl.formatDate(value, dateFormatOptions)));

      if (onChange) {
        onChange(cleanedValues);
      }
    }
  };

  return (
    <div id={id} className={classes} ref={element}>
      <DatePicker
        range={true}
        showMonthStepper={true}
        onChange={handleChange}
        isBlockedBetween={isBlockedBetween}
        value={dateRange}
        rangeStartHasValue={rawValues?.[0]?.length > 0}
        rangeEndHasValue={rawValues?.[1]?.length > 0}
        {...startDateMaybe}
        {...rest}
      />
    </div>
  );
};

export default DateRangeController;
