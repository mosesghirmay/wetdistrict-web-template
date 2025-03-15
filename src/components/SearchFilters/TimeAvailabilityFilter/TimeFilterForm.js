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

  const classes = classNames(rootClassName || css.root, className);
  const formClasses = classNames(
    css.form,
    { [css.disabledForm]: isLoading }
  );

  // Get the end time display option
  const endTimeOption = endTime ? findTimeOption(timeOptions, endTime) : null;
  
  // If endTime doesn't match our fixed options (e.g. "13:00"), create a custom display option
  const customEndTimeOption = endTime && !endTimeOption ? {
    key: endTime,
    label: intl.formatTime(new Date().setHours(
      parseInt(endTime.split(':')[0], 10),
      parseInt(endTime.split(':')[1] || '0', 10),
      0
    ), {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    value: endTime
  } : null;
  
  return (
    <div className={classes}>
      <div className={formClasses}>
        <div className={css.formRow}>
          <div className={css.field}>
            <label htmlFor="availability-start-time" className={css.fieldLabel}>
              {intl.formatMessage({ id: 'TimeFilterForm.startTimeLabel' })}
            </label>
            <select
              className={css.selectField}
              name="availabilityStartTime"
              id="availability-start-time"
              onChange={e => setStartTime(e.target.value)}
              value={startTime || ''}
              disabled={isLoading}
            >
              <option value="">
                {intl.formatMessage({ id: 'TimeFilterForm.startTimePlaceholder' })}
              </option>
              {timeOptions.map(option => (
                <option key={option.key} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        
          <div className={css.toSeparator}>
            <FormattedMessage id="TimeFilterForm.toLabel" />
          </div>
          
          {/* Read-only end time field (automatically calculated) */}
          <div className={css.fieldReadOnly}>
            <label className={css.fieldLabel}>
              {intl.formatMessage({ id: 'TimeFilterForm.endTimeLabel' })}
            </label>
            <div className={css.endTimeDisplay}>
              {customEndTimeOption 
                ? customEndTimeOption.label 
                : endTimeOption 
                  ? endTimeOption.label 
                  : intl.formatMessage({ id: 'TimeFilterForm.fixedDurationLabel' })}
            </div>
            <input 
              type="hidden" 
              name="availabilityEndTime" 
              value={endTime || ''} 
            />
          </div>
        </div>
        
        <div className={css.durationNote}>
          <FormattedMessage id="TimeFilterForm.fixedDurationNote" />
        </div>
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