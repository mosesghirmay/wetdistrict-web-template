import React from 'react';

// utils
import { SCHEMA_TYPE_ENUM, SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_LONG } from '../../util/types';
import { convertCategoriesToSelectTreeOptions, constructQueryParamName } from '../../util/search';

// component imports
import SelectSingleFilter from './SelectSingleFilter/SelectSingleFilter';
import SelectMultipleFilter from './SelectMultipleFilter/SelectMultipleFilter';
import BookingDateRangeFilter from './BookingDateRangeFilter/BookingDateRangeFilter'; // ✅ Default Sharetribe Date Picker
import KeywordFilter from './KeywordFilter/KeywordFilter';
import PriceFilter from './PriceFilter/PriceFilter';
import IntegerRangeFilter from './IntegerRangeFilter/IntegerRangeFilter';
import SeatsFilter from './SeatsFilter/SeatsFilter';
import StartTimeFilter from './StartTimeFilter/StartTimeFilter';
import GuestsFilter from './GuestsFilter/GuestsFilter';

// Debugging to confirm component renders
console.log("✅ FilterComponent is rendering in Topbar!");

/**
 * FilterComponent maps configured filter types to actual filter components.
 */
const FilterComponent = props => {
  const {
    idPrefix,
    config,
    urlQueryParams,
    initialValues,
    getHandleChangedValueFn,
    listingCategories,
    marketplaceCurrency,
    intl,
    ...rest
  } = props;

  // Debugging: Log the received props
  console.log("📍 Props in FilterComponent:", props);

  const { key, schemaType } = config;
  const { liveEdit, showAsPopup } = rest;
  const useHistoryPush = liveEdit || showAsPopup;
  const prefix = idPrefix || 'SearchPage';
  const componentId = `${prefix}.${key.toLowerCase()}`;
  const name = key.replace(/\s+/g, '-');

  switch (schemaType) {
    case 'category': {
      const { scope, isNestedEnum, nestedParams } = config;
      const queryParamNames = nestedParams?.map(p => constructQueryParamName(p, scope));
      return (
        <SelectSingleFilter
          id={componentId}
          name={key}
          label={intl.formatMessage({ id: 'FilterComponent.categoryLabel' })}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={convertCategoriesToSelectTreeOptions(listingCategories)}
          isNestedEnum={isNestedEnum}
          {...rest}
        />
      );
    }
    case 'price': {
      const { min, max, step } = config;
      return (
        <PriceFilter
          id={componentId}
          label={intl.formatMessage({ id: 'FilterComponent.priceLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          min={min}
          max={max}
          step={step}
          marketplaceCurrency={marketplaceCurrency}
          {...rest}
        />
      );
    }
    case 'keywords':
      return (
        <KeywordFilter
          id={componentId}
          label={intl.formatMessage({ id: 'FilterComponent.keywordsLabel' })}
          name={name}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...rest}
        />
      );

    // **✅ Reverting to Sharetribe's Default Date Range Picker**
    // Modify just the dates case in FilterComponent.js
   // In src/containers/SearchPage/FilterComponent.js, update the 'dates' case:

case 'dates': {
  // Check if we should use the calendar-only mode
  const calendarOnly = config.filterConfig?.calendarOnly || false;
  
  if (calendarOnly) {
    return (
      <StartTimeFilter
        id={componentId}
        label={intl.formatMessage({ id: 'FilterComponent.datesLabel' })}
        queryParamNames={[key]}
        initialValues={initialValues([key], liveEdit)}
        onSubmit={getHandleChangedValueFn(useHistoryPush)}
        useCalendarOnly={true}
        {...rest}
      />
    );
  } else {
    return (
      <BookingDateRangeFilter
        id={componentId}
        label="Date:" // Changed from "Date" to "Date:" with colon
        queryParamNames={[key]}
        initialValues={initialValues([key], liveEdit)}
        onSubmit={getHandleChangedValueFn(useHistoryPush)}
        forceSingleDay={true}
        isSearchFiltersMobile={true} // Always pass this as true to ensure our styling is applied
        {...rest}
      />
    );
  }
}

case 'StartTime': {
  const { scope, enumOptions, filterConfig = {} } = config;
  const queryParamNames = [`pub_StartTime`]; // Matches the publicData field
  
  // Check if we should use the calendar-only mode from StartTimeFilter
  const useCalendarOnly = filterConfig?.calendarOnly || false;
  
  if (useCalendarOnly) {
    return (
      <StartTimeFilter
        id={componentId}
        label={filterConfig.label}
        queryParamNames={queryParamNames}
        initialValues={initialValues(queryParamNames, liveEdit)}
        onSubmit={getHandleChangedValueFn(useHistoryPush)}
        useCalendarOnly={true}
        {...rest}
      />
    );
  } else {
    return (
      <SelectSingleFilter
        id={componentId}
        label={filterConfig.label}
        queryParamNames={queryParamNames}
        initialValues={initialValues(queryParamNames, liveEdit)}
        onSubmit={getHandleChangedValueFn(useHistoryPush)}
        options={enumOptions}
        {...rest}
      />
    );
  }
}


    case 'seats': {
      return (
        <SeatsFilter
          id={componentId}
          name={name}
          label={intl.formatMessage({ id: 'FilterComponent.seatsLabel' })}
          queryParamNames={[key]}
          initialValues={initialValues([key], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...rest}
        />
      );
    }
  }

  // **Custom Extended Data Filters**
  switch (schemaType) {
    case SCHEMA_TYPE_ENUM: {
      const { scope, enumOptions, filterConfig = {} } = config;
      const { label, filterType } = filterConfig;
      const queryParamNames = [constructQueryParamName(key, scope)];
      return filterType === 'SelectSingleFilter' ? (
        <SelectSingleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          {...rest}
        />
      ) : (
        <SelectMultipleFilter
          id={componentId}
          label={label}
          name={name}
          queryParamNames={queryParamNames}
          initialValues={initialValues(queryParamNames, liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={enumOptions}
          schemaType={schemaType}
          {...rest}
        />
      );
    }
    case SCHEMA_TYPE_MULTI_ENUM:
      return (
        <SelectMultipleFilter
          id={componentId}
          label={config.filterConfig?.label || key}
          name={name}
          queryParamNames={[constructQueryParamName(key, config.scope)]}
          initialValues={initialValues([constructQueryParamName(key, config.scope)], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          options={config.enumOptions}
          {...rest}
        />
      );

    case SCHEMA_TYPE_LONG:
      // For guest capacity filter, use a dropdown similar to StartTimeFilter
      if (key === 'maxGuests' || key === 'capacity' || name === 'pub_maxGuests') {
        // Generate guest count options for the dropdown
        const guestOptions = [];
        for (let i = 1; i <= 24; i++) {
          guestOptions.push({
            option: i.toString(),
            label: i.toString()
          });
        }
        
        // Ensure we're using the correct parameter name format
        const paramName = constructQueryParamName(key, config.scope);
        console.log(`Guest filter param name: ${paramName} for key: ${key}, scope: ${config.scope}`);
        
        return (
          <GuestsFilter
            id={componentId}
            label="Who"
            name={name}
            queryParamNames={[paramName]}
            initialValues={initialValues([paramName], liveEdit)}
            onSubmit={getHandleChangedValueFn(useHistoryPush)}
            options={guestOptions}
            {...rest}
          />
        );
      }
      
      return (
        <IntegerRangeFilter
          id={componentId}
          label={config.filterConfig?.label || key}
          name={name}
          queryParamNames={[constructQueryParamName(key, config.scope)]}
          initialValues={initialValues([constructQueryParamName(key, config.scope)], liveEdit)}
          onSubmit={getHandleChangedValueFn(useHistoryPush)}
          {...rest}
        />
      );

    default:
      return null;
  }
};

export default FilterComponent;
