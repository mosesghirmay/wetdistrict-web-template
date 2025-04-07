import React, { Component } from 'react';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { parseDateFromISO8601, stringifyDateToISO8601 } from '../../../util/dates';

import { FieldDateRangeController } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import FilterPopupForSidebar from './FilterPopupForSidebar';
import css from './BookingDateRangeFilter.module.css';

const getDatesQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'dates';
};

// Parse query parameter, which could be either "2020-05-28,2020-05-28" for single date or "2020-05-28,2020-05-31" for range
const parseValue = value => {
  if (!value) return { dates: null };
  
  console.log('BookingDateRangeFilter parsing value:', value);
  
  try {
    // Always split by comma, assuming the comma format is used
    const rawValuesFromParams = value.split(',');
    
    if (rawValuesFromParams.length < 1) {
      return { dates: null };
    }
    
    // Parse the start date (first part of the parameter)
    const startDate = parseDateFromISO8601(rawValuesFromParams[0]);
    if (!startDate) {
      console.log('Could not parse start date:', rawValuesFromParams[0]);
      return { dates: null };
    }
    
    // For a date range with two dates, we need to handle it specially
    // The typical format from the API is "2020-05-28,2020-05-29" for a single day
    // where the end date is the next day (exclusive end)
    
    // For date filter selection, we only need the start date
    // We'll set the end date equal to the start date for simplicity
    // and to match how the UI expects a single day selection
    
    // Create a date-only copy of the startDate to ensure consistency
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    
    const result = { 
      dates: { 
        startDate: startDateOnly, 
        endDate: startDateOnly // Use same date for both start and end
      } 
    };
    
    console.log('Parsed date result:', result);
    return result;
  } catch (error) {
    console.error('Error parsing date value:', error);
    return { dates: null };
  }
};
// Format dateRange value for the query. It's given by FieldDateRangeInput:
// { dates: { startDate, endDate } }
const formatValue = (dateRange, queryParamName) => {
  const hasDates = dateRange && dateRange.dates;
  const { startDate, endDate } = hasDates ? dateRange.dates : {};
  
  if (!startDate) {
    console.log('No start date provided');
    return { [queryParamName]: null };
  }
  
  try {
    // Create a date object for the selected startDate
    // For single day selection, the endDate is usually the same as startDate
    // or may be the next day (for a day booking)
    const start = stringifyDateToISO8601(startDate);
    
    // For date filtering, we set up the date range for a SINGLE DAY
    // this is crucial for API compatibility with daily booking
    
    // Get next day (to create proper date range)
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const end = stringifyDateToISO8601(nextDay);
    
    // Format: "2023-04-07,2023-04-08" (one day range from midnight to midnight)
    // This format is necessary for the Sharetribe API to filter correctly
    const value = `${start},${end}`;
    
    console.log('Date parameter:', {
      value,
      startDate: start,
      endDate: end,
      originalStartDate: startDate,
      originalEndDate: endDate
    });
    
    // Return the query parameter
    return { [queryParamName]: value };
  } catch (error) {
    console.error('Error formatting date value:', error);
    return { [queryParamName]: null };
  }
};

/**
 * BookingDateRangeFilter component
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The ID
 * @param {React.Node} [props.label] - The label
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {boolean} [props.liveEdit] - Whether to live edit
 * @param {Array<string>} [props.queryParamNames] - The query param names (e.g. ['dates'])
 * @param {Function} props.onSubmit - The function to submit
 * @param {number} [props.minimumNights] - The minimum nights (default: 0)
 * @param {Object} [props.initialValues] - The initial values
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
export class BookingDateRangeFilterComponent extends Component {
  constructor(props) {
    super(props);


    this.popupControllerRef = null;
    this.plainControllerRef = null;

    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      className,
      rootClassName,
      showAsPopup = true,
      isDesktop = false,
      initialValues,
      id,
      contentPlacementOffset = 0,
      onSubmit,
      queryParamNames,
      label,
      intl,
      minimumNights = 0,
      ...rest
    } = this.props;

    const datesQueryParamName = getDatesQueryParamName(queryParamNames);
    const initialDates =
      initialValues && initialValues[datesQueryParamName]
        ? parseValue(initialValues[datesQueryParamName])
        : { dates: null };

    const isSelected = !!initialDates.dates;
    const startDate = isSelected ? initialDates.dates.startDate : null;
    const endDate = isSelected ? initialDates.dates.endDate : null;

    const format = {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    };

    // Get current date for default display
    const currentDate = new Date();
    
    // Format dates, adding the day of week for better visibility
    const formattedStartDate = isSelected 
      ? intl.formatDate(startDate, format) 
      : intl.formatDate(currentDate, format);
    
    // When no date is selected, show the current date in a placeholder format
    const labelForPlain = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPlain' },
          {
            // For single date selection, just show the start date without the range indicator
            dates: formattedStartDate,
          }
        )
      : label
      ? `${label}`  // Only show "Date:" as the label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPlain' });
      
    // Don't show placeholder date when not selected - it's confusing
    const placeholderDate = null;

    const labelForPopup = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            // For single date selection, just show the start date without the range indicator
            dates: formattedStartDate,
          }
        )
      : label
      ? `${label}`  // Only show "Date:" as the label
      : intl.formatMessage({ id: 'BookingDateRangeFilter.labelPopup' });

    const labelSelection = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateRangeFilter.labelSelectedPopup' },
          {
            // For single date selection, just show the start date without the range indicator
            dates: formattedStartDate,
          }
        )
      : null;

    const handleSubmit = values => {
      // Check if we have valid date values before submitting
      if (values && values.dates && values.dates.startDate) {
        console.log('Submitting date filter:', values);
        
        // Format and submit the date range
        const formattedValue = formatValue(values, datesQueryParamName);
        console.log('Formatted date for submission:', formattedValue);
        
        onSubmit(formattedValue);
      } else {
        console.log('No valid date to submit');
      }
    };

    const onClearPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onClear: () => this.popupControllerRef.onReset(null, null) }
        : {};

    const onCancelPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onCancel: () => this.popupControllerRef.onReset(startDate, endDate) }
        : {};

    const onClearPlainMaybe =
      this.plainControllerRef && this.plainControllerRef.onReset
        ? { onClear: () => this.plainControllerRef.onReset(null, null) }
        : {};

    return showAsPopup ? (
      <FilterPopup
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={labelForPopup}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopup>
    ) : isDesktop ? (
      <FilterPopupForSidebar
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={label}
        labelSelection={labelSelection}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDates}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopupForSidebar>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={label}
        labelSelection={labelSelection}
        labelSelectionSeparator=""
        isSelected={isSelected}
        id={`${id}.plain`}
        liveEdit
        onSubmit={handleSubmit}
        {...onClearPlainMaybe}
        initialValues={initialDates}
        plainClassName="datesFilterHeader"
        style={{ width: '100%' }}
        placeholderText={placeholderDate}
        {...rest}
      >
        <FieldDateRangeController
          name="dates"
          minimumNights={minimumNights}
          controllerRef={node => {
            this.plainControllerRef = node;
          }}
        />
      </FilterPlain>
    );
  }
}

const BookingDateRangeFilter = injectIntl(BookingDateRangeFilterComponent);

export default BookingDateRangeFilter;
