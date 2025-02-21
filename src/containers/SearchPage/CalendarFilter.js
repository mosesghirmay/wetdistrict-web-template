import React from 'react';
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter';

const CalendarFilter = props => {
  const {
    idPrefix,
    config = {}, // ✅ Provide default empty object to avoid "undefined" error
    urlQueryParams,
    initialValues,
    getHandleChangedValueFn,
    intl,
    ...rest
  } = props;

  if (!config || !config.key) {
    console.error("🚨 CalendarFilter: Missing 'config' prop or 'key' property.");
    return null; // Prevents crash by returning nothing instead of breaking
  }

  const { key, schemaType } = config;
  const { liveEdit, showAsPopup } = rest;
  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${key.toLowerCase()}`;

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

  return null;
};

export default CalendarFilter;
