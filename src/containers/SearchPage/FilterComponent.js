import React from 'react';

// component imports
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter';

/**
 * FilterComponent is used to map configured filter types
 * to actual filter components (only keeping date-related logic)
 */
const FilterComponent = props => {
  const {
    idPrefix,
    config,
    urlQueryParams,
    initialValues,
    getHandleChangedValueFn,
    intl,
    ...rest
  } = props;

  const { key, schemaType } = config;
  const { liveEdit, showAsPopup } = rest;
  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${key.toLowerCase()}`;

  // Only keeping date-related filter logic
  if (schemaType === 'dates') {
    const { dateRangeMode } = config;
    const isNightlyMode = dateRangeMode === 'night';
    return (
      <BookingDateRangeFilter
        id={componentId}
        label={intl.formatMessage({ id: 'FilterComponent.datesLabel' })}
        queryParamNames={[key]}
        initialValues={initialValues([key], liveEdit)}
        onSubmit={getHandleChangedValueFn(useHistoryPush)}
        minimumNights={isNightlyMode ? 1 : 0}
        {...rest}
      />
    );
  }

  return null; // Hide everything else
};

export default FilterComponent;
