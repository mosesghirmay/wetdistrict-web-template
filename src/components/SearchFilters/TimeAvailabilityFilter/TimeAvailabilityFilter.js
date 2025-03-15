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
    const { availabilityStartTime, availabilityEndTime } = values;
    
    // Use current date if not specified
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Convert the form values to availability parameters for the API
    const availabilityParams = timeRangeToAvailabilityParameters(
      dateStr,
      availabilityStartTime,
      availabilityEndTime
    );
    
    // This ensures all relevant parameters are passed to the SDK query
    const filterParams = {
      availabilityStartTime,
      availabilityEndTime,
      availabilityDate: dateStr,
      ...availabilityParams
    };
    
    // Call onSubmit with the filter parameters to update the URL/query
    onSubmit(filterParams);
    setIsLoading(false);
  }, [onSubmit]);

  // Handle the filter clear button click
  const handleClear = useCallback(() => {
    onClear();
  }, [onClear]);

  // Initialize form values from URL params or defaults
  const initialFilterValues = {
    availabilityStartTime: queryParams.availabilityStartTime || null,
    availabilityEndTime: queryParams.availabilityEndTime || null,
    ...initialValues
  };

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