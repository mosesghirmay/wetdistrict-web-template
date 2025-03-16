import React, { useState, useEffect, useMemo } from 'react';
import { func, string, object, bool } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';

import css from './TimeFilterForm.module.css';

// Generate only the allowed time options: 10AM, 2PM, 6PM
const generateFixedTimeOptions = (intl) => {
  const allowedHours = [10, 14, 18]; // 10 AM, 2 PM, 6 PM
  
  return allowedHours.map(hour => {
    const date = new Date();
    date.setHours(hour, 0, 0);
    
    return {
      key: `${hour}:00`,
      label: intl.formatTime(date, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      value: `${hour}:00`,
    };
  });
};

// Find the 2 PM option index for default selection
const find2PMOptionIndex = (options) => {
  return options.findIndex(option => option.value === '14:00');
};

// Calculate end time based on start time (3 hour fixed duration)
const calculateEndTime = (startTimeStr) => {
  if (!startTimeStr) return null;
  
  const [hours, minutes] = startTimeStr.split(':').map(n => parseInt(n, 10));
  
  // Add 3 hours to get the end time
  let endHours = hours + 3;
  const endMinutes = minutes;
  
  // Format the end time string
  return `${endHours.toString().padStart(2, '0')}:${endMinutes === 0 ? '00' : endMinutes.toString().padStart(2, '0')}`;
};

// Find the display option for a given time value
const findTimeOption = (timeOptions, timeValue) => {
  return timeOptions.find(option => option.value === timeValue);
};

const TimeFilterFormComponent = props => {
  const {
    rootClassName,
    className,
    intl,
    onSubmit,
    timeZone,
    isLoading,
    initialValues = {},
    ...rest
  } = props;

  const [startTime, setStartTime] = useState(initialValues.availabilityStartTime || null);
  const [endTime, setEndTime] = useState(initialValues.availabilityEndTime || null);
  const [lastSubmittedTime, setLastSubmittedTime] = useState(null);

  // Generate fixed time options - memoized to prevent unnecessary recalculation
  const timeOptions = useMemo(() => generateFixedTimeOptions(intl), [intl]);
  
  // Set default to 2PM when component initializes
  useEffect(() => {
    if (!startTime) {
      const defaultTimeIndex = find2PMOptionIndex(timeOptions);
      const defaultTime = defaultTimeIndex !== -1 ? timeOptions[defaultTimeIndex].value : timeOptions[0]?.value;
      
      if (defaultTime) {
        setStartTime(defaultTime);
      }
    }
  }, [timeOptions]);
  
  // Automatically calculate end time when start time changes (3-hour fixed duration)
  useEffect(() => {
    if (startTime) {
      const calculatedEndTime = calculateEndTime(startTime);
      setEndTime(calculatedEndTime);
      
      // Prevent duplicate submissions of the same time
      if (calculatedEndTime && startTime !== lastSubmittedTime) {
        setLastSubmittedTime(startTime);
        onSubmit({
          availabilityStartTime: startTime,
          availabilityEndTime: calculatedEndTime
        });
      }
    } else {
      setEndTime(null);
    }
  }, [startTime, onSubmit, lastSubmittedTime]);

  const isTimeSelected = !!startTime;

  const classes = classNames(
    rootClassName || css.root, 
    className,
    { [css.selected]: isTimeSelected }
  );
  
  const formClasses = classNames(
    css.form,
    { [css.disabledForm]: isLoading }
  );

  // Format end time to show 5 PM if start time is 2 PM, or placeholder if no time selected
  const formatEndTime = () => {
    if (!endTime) {
      // Format default end time (5:00 PM) if nothing is selected
      const defaultDate = new Date();
      defaultDate.setHours(17, 0, 0); // 5:00 PM
      
      return intl.formatTime(defaultDate, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    const hour = parseInt(endTime.split(':')[0], 10);
    const minute = parseInt(endTime.split(':')[1] || '0', 10);
    
    // Create date object for formatting
    const date = new Date();
    date.setHours(hour, minute, 0);
    
    return intl.formatTime(date, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const formattedEndTime = formatEndTime();
  
  return (
    <div className={classes}>
      <div className={formClasses}>
        {/* Add a "Time:" label at the top to match DatePicker styling */}
       
        
        <div className={css.formRow}>
          <div className={css.field}>
            <label className={css.innerLabel}>
              {intl.formatMessage({ id: 'TimeFilterForm.startTimeLabel' })}
            </label>
            <select
              className={css.selectField}
              name="availabilityStartTime"
              id="availability-start-time"
              onChange={e => setStartTime(e.target.value)}
              value={startTime || timeOptions[0]?.value || ''}
              disabled={isLoading}
            >
              {timeOptions.map(option => (
                <option key={option.key} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        
          <div className={css.toSeparator}>
            -
          </div>
          
          {/* Read-only end time field (automatically calculated) */}
          <div className={css.fieldReadOnly}>
            <label className={css.innerLabel}>
              {intl.formatMessage({ id: 'TimeFilterForm.endTimeLabel' })}
            </label>
            <div className={css.endTimeDisplay}>
              {formattedEndTime}
            </div>
            <input 
              type="hidden" 
              name="availabilityEndTime" 
              value={endTime || ''} 
            />
          </div>
        </div>
        
        {startTime && (
          <div className={css.durationNote}>
            <FormattedMessage id="TimeFilterForm.fixedDurationNote" />
          </div>
        )}
      </div>
    </div>
  );
};

TimeFilterFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: {},
  isLoading: false,
};

TimeFilterFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  timeZone: string.isRequired,
  isLoading: bool,
  initialValues: object,
};

const TimeFilterForm = injectIntl(TimeFilterFormComponent);

export default TimeFilterForm;