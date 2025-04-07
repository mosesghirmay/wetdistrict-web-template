import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // Use empty default value to force selection
  const [startTime, setStartTime] = useState(initialValues.availabilityStartTime || '');
  const [endTime, setEndTime] = useState(initialValues.availabilityEndTime || '');
  const [lastSubmittedTime, setLastSubmittedTime] = useState(null);
  // Always start unselected regardless of initialValues, so styling is correct
  const [isSelected, setIsSelected] = useState(false);
  const selectRef = useRef(null);

  // Generate fixed time options - memoized to prevent unnecessary recalculation
  const timeOptions = useMemo(() => generateFixedTimeOptions(intl), [intl]);
  
  // Effect to submit initial values on mount
  useEffect(() => {
    // Submit initial values on component mount to ensure filter is applied
    if (startTime) {
      const calculatedEndTime = calculateEndTime(startTime);
      
      onSubmit({
        availabilityStartTime: startTime,
        availabilityEndTime: calculatedEndTime,
        availabilityDate: new Date().toISOString().split('T')[0]
      });
    }
  }, []); // Empty dependency array to run only on mount
  
  // Automatically calculate end time when start time changes (3-hour fixed duration)
  useEffect(() => {
    if (startTime) {
      const calculatedEndTime = calculateEndTime(startTime);
      setEndTime(calculatedEndTime);
    } else {
      setEndTime(null);
    }
  }, [startTime]);

  const classes = classNames(
    rootClassName || css.root, 
    className,
    { [css.selected]: isSelected }
  );
  
  // Apply selected class to the form itself, not just the parent container
  const formClasses = classNames(
    css.form,
    { [css.disabledForm]: isLoading },
    { [css.selected]: isSelected }
  );

  // Handle dropdown change events
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    
    // Always mark as selected when a real change is made
    setIsSelected(true);
    setStartTime(newTime);
    
    // Submit directly on change to ensure it works with mobile filters
    const calculatedEndTime = calculateEndTime(newTime);
    onSubmit({
      availabilityStartTime: newTime,
      availabilityEndTime: calculatedEndTime,
      // Include current date as well (set to today's date)
      availabilityDate: new Date().toISOString().split('T')[0]
    });
  };
  
  // This function is triggered when the select field is clicked/interacted with
  const handleSelectInteraction = () => {
    // Don't mark as selected when just clicking - wait for actual selection
    // setIsSelected handled in handleTimeChange instead
  };

  // Format end time to show after selected time, or placeholder if no time selected
  const formatEndTime = () => {
    if (!endTime || !startTime) {
      // Display placeholder if no time is selected
      return 'End time';
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
        <div className={css.formRow}>
          <div className={css.field}>
            <label className={css.innerLabel}>
              {intl.formatMessage({ id: 'TimeFilterForm.startTimeLabel' })}
            </label>
            <select
              className={classNames(
                css.selectField,
                { [css.selectedField]: isSelected }
              )}
              name="availabilityStartTime"
              id="availability-start-time"
              onChange={handleTimeChange}
              value={startTime}
              disabled={isLoading}
              ref={selectRef}
            >
              <option value="" disabled>
                Select time
              </option>
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
            <div className={classNames(
              css.endTimeDisplay,
              { [css.selectedEndTime]: isSelected }
            )}>
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