import React, { useState, useCallback } from 'react';
import { func, object, string } from 'prop-types';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import TimeFilterForm from './TimeFilterForm';
import css from './TimeAvailabilityFilter.module.css';
import { timeRangeToAvailabilityParameters } from '../../../util/timeAvailabilitySearch';

const TimeAvailabilityFilterComponent = props => {
  const {
    rootClassName,
    className,
    id,
    queryParams,
    onSubmit,
    onClear,
    intl,
    timeZone,
    initialValues,
    ...rest
  } = props;
  
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = useCallback(values => {
    setIsLoading(true);
    
    // Get values from form
    const { availabilityStartTime, availabilityEndTime, availabilityDate } = values;
    
    // Use current date if not specified
    const dateStr = availabilityDate || new Date().toISOString().split('T')[0];
    
    // Ensure we have valid time values
    if (!availabilityStartTime || !availabilityEndTime) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Create proper date objects for the selected times
      const [startHours, startMinutes] = availabilityStartTime.split(':').map(n => parseInt(n, 10));
      const [endHours, endMinutes] = availabilityEndTime.split(':').map(n => parseInt(n, 10));
      
      // Create Date objects with the correct date and times
      const startDate = new Date(dateStr);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date(dateStr);
      endDate.setHours(endHours, endMinutes, 0, 0);
      
      // Convert to ISO strings for the API
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      // Directly provide all needed parameters for the search
      const filterParams = {
        availabilityStartTime,
        availabilityEndTime,
        availabilityDate: dateStr,
        availability: 'time-partial',
        start: startISO,
        end: endISO,
        minDuration: 180, // 3 hours in minutes
      };
      
      console.log('Submitting time filter params:', filterParams);
      
      // Call onSubmit with the filter parameters to update the URL/query
      onSubmit(filterParams);
    } catch (e) {
      console.error('Error processing time filter:', e);
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  // Handle the filter clear button click
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  // Initialize form values from URL params or defaults
  const initialFilterValues = {
    availabilityStartTime: queryParams.availabilityStartTime || '14:00',
    availabilityEndTime: queryParams.availabilityEndTime || '17:00',
    availabilityDate: queryParams.availabilityDate || new Date().toISOString().split('T')[0],
    ...initialValues
  };
  
  // Debug log to see what initial values are being passed
  console.log('Initial filter values:', initialFilterValues);

  return (
    <div className={className || css.root}>
      <TimeFilterForm
        id={`${id}-form`}
        onSubmit={handleSubmit}
        intl={intl}
        timeZone={timeZone}
        initialValues={initialFilterValues}
        isLoading={isLoading}
        {...rest}
      />
    </div>
  );
};

TimeAvailabilityFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: {},
};

TimeAvailabilityFilterComponent.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  queryParams: object.isRequired,
  onSubmit: func.isRequired,
  onClear: func.isRequired,
  intl: intlShape.isRequired,
  timeZone: string.isRequired,
  initialValues: object,
};

const TimeAvailabilityFilter = injectIntl(TimeAvailabilityFilterComponent);

export default TimeAvailabilityFilter;