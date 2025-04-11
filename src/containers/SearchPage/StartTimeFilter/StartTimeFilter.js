import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import { FieldDateAndTimeInput, FieldSelect } from '../../../components';
import css from './StartTimeFilter.module.css';

/**
 * An enhanced version of the StartTime filter that supports:
 * 1. Original dropdown select behavior
 * 2. Calendar-only mode that shows just a date picker button
 */
const StartTimeFilterComponent = props => {
  const {
    rootClassName,
    className,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    onSubmit,
    showAsPopup,
    options,
    intl,
    useCalendarOnly,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  // For calendar mode, we need to track the date
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Try to initialize the date from URL parameters if available
  React.useEffect(() => {
    if (initialValues && initialValues.dates) {
      const dateStr = initialValues.dates.split(',')[0]; // Get the first date
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        } catch (e) {
          console.error('Error parsing date from URL', e);
        }
      }
    }
  }, [initialValues]);

  const handleSubmit = values => {
    if (useCalendarOnly) {
      // In calendar-only mode, we only want to submit the date
      if (selectedDate) {
        // Format the date in YYYY-MM-DD format
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // Create a date range for a single day (startDate to startDate+1)
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        
        // Format as expected by the API: "2023-04-07,2023-04-08"
        const dateRange = `${dateStr},${nextDayStr}`;
        
        console.log('Submitting date range:', dateRange);
        onSubmit({ dates: dateRange });
      }
    } else {
      // In regular mode, handle as before
      const time = values[name];
      onSubmit({ [queryParamNames[0]]: time });
    }
  };

  // For non-calendar mode: Format options for select field
  const timeOptions = options ? options.map(option => ({
    key: option.option,
    label: option.label
  })) : [];

  if (useCalendarOnly) {
    // Calendar-only mode
    return (
      <div className={classes}>
        <FieldDateAndTimeInput
          id={id}
          bookingStartDate={selectedDate}
          bookingStartTime={null}
          bookingEndTime={null}
          onBookingStartDateChange={date => {
            setSelectedDate(date);
            
            if (date) {
              // Format the date in YYYY-MM-DD format
              const dateStr = date.toISOString().split('T')[0];
              
              // Create a date range for a single day (startDate to startDate+1)
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayStr = nextDay.toISOString().split('T')[0];
              
              // Format as expected by the API: "2023-04-07,2023-04-08"
              const dateRange = `${dateStr},${nextDayStr}`;
              
              console.log('Date selected:', {
                originalDate: date,
                dateStr,
                nextDayStr,
                dateRange
              });
              
              // Submit the formatted date range
              onSubmit({ dates: dateRange });
            }
          }}
          onBookingStartTimeChange={() => {}}
          onBookingEndTimeChange={() => {}}
          timeZone="Etc/UTC" // Default timezone
          classes={css.calendarInput}
          calendarOnly={true}
        />
      </div>
    );
  } else {
    // Regular dropdown select mode
    return (
      <div className={classes}>
        <FieldSelect
          className={css.select}
          id={id}
          name={name || 'startTime'}
          label={label}
          validate={() => {}}
          options={timeOptions}
          onChange={(e) => {
            // Direct submit on change without relying on formState
            const value = e.target.value;
            onSubmit({ [queryParamNames[0]]: value });
          }}
        />
      </div>
    );
  }
};

StartTimeFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  showAsPopup: false,
  useCalendarOnly: false,
  options: [],
};

StartTimeFilterComponent.propTypes = {
  rootClassName: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  label: PropTypes.string,
  queryParamNames: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  showAsPopup: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  intl: intlShape.isRequired,
  useCalendarOnly: PropTypes.bool,
};

const StartTimeFilter = injectIntl(StartTimeFilterComponent);

export default StartTimeFilter;
