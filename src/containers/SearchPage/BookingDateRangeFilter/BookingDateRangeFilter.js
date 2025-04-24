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

// Parse query parameter in format "2020-05-28,2020-05-29" (start date, end date)
const parseValue = value => {
  if (!value) return { dates: null };
  
  console.log('BookingDateRangeFilter parsing value:', value);
  
  try {
    // Split comma-separated date parameter
    const rawValuesFromParams = value.split(',');
    
    if (rawValuesFromParams.length < 1) {
      return { dates: null };
    }
    
    // Parse the start date, being careful with timezones
    // Use a method that preserves the actual day selected
    let startDate;
    
    // Extract year, month, day directly from the date string
    if (rawValuesFromParams[0].includes('-')) {
      const [year, month, day] = rawValuesFromParams[0].split('-').map(Number);
      // Create date in local timezone (months are 0-indexed in JS Date)
      startDate = new Date(year, month - 1, day, 0, 0, 0);
    } else if (rawValuesFromParams[0].includes('T')) {
      // Try to handle ISO format with time
      startDate = new Date(rawValuesFromParams[0]);
    } else {
      // Fallback
      startDate = new Date(rawValuesFromParams[0]);
    }
    
    // Validate we got a valid date
    if (isNaN(startDate.getTime())) {
      console.log('Could not parse start date:', rawValuesFromParams[0]);
      return { dates: null };
    }
    
    // Log the exact day we parsed for debugging
    console.log('Parsed date details:', {
      dateString: rawValuesFromParams[0],
      parsedDate: startDate,
      day: startDate.getDate(),
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      dayOfWeek: startDate.getDay(), // 0 = Sunday, 1 = Monday, etc.
      fullLocalDate: startDate.toLocaleString()
    });
    
    // Verify we have the right day (Tuesday should be 2)
    if (startDate.getDay() === 2) {
      console.log('✅ TUESDAY detected correctly!');
    }
    
    // Create properly structured date object for the date picker component
    const result = { 
      dates: { 
        startDate: startDate,
        endDate: startDate // Use same date for both start and end for single day selection
      } 
    };
    
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
    // Ensure we're working with proper Date objects
    const startDateObj = startDate instanceof Date ? startDate : new Date(startDate);
    
    // To preserve the actual day, we'll use a different approach
    // Get the year, month, day directly
    const year = startDateObj.getFullYear();
    const month = startDateObj.getMonth() + 1; // Months are 0-indexed
    const day = startDateObj.getDate();
    
    // Format start date manually to avoid timezone issues
    const start = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // For booking API compatibility, we need a day range (current day to next day)
    // Create a new date for the next day to avoid modifying the original
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0);
    const nextYear = nextDay.getFullYear();
    const nextMonth = nextDay.getMonth() + 1;
    const nextDayDate = nextDay.getDate();
    
    // Format end date manually
    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDayDate).padStart(2, '0')}`;
    
    // Create the date parameter in format required by the API: "2023-04-07,2023-04-08"
    const value = `${start},${end}`;
    
    console.log('Date parameter formatted successfully:', {
      value,
      startDate: start,
      endDate: end,
      originalDay: startDateObj.getDay(), // Day of week (0-6, 0 is Sunday)
      originalDate: startDateObj.getDate(), // Day of month (1-31)
      fullOriginalDate: startDateObj.toLocaleString(), // Full local date for verification
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startDateObj.getDay()]
    });
    
    // Return the query parameter with properly formatted value
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
    
    // When no date is selected, only show label without date
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
      
    // Always show current date as placeholder when no date is selected
    const placeholderDate = !isSelected ? formattedStartDate : null;

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
        
        // Create a clean copy with exact dates to avoid any timezone issues
        const exactStartDate = new Date(
          values.dates.startDate.getFullYear(),
          values.dates.startDate.getMonth(),
          values.dates.startDate.getDate(),
          0, 0, 0
        );
        
        const exactValues = {
          dates: {
            startDate: exactStartDate,
            endDate: exactStartDate // Same day for single-day selection
          }
        };
        
        // Log the exact values with detailed day info
        console.log('Exact date being submitted:', {
          originalStartDate: values.dates.startDate.toLocaleString(),
          exactStartDate: exactStartDate.toLocaleString(),
          day: exactStartDate.getDate(),
          month: exactStartDate.getMonth() + 1,
          year: exactStartDate.getFullYear(),
          dayOfWeek: exactStartDate.getDay(),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][exactStartDate.getDay()]
        });
        
        // Format and submit the date range
        const formattedValue = formatValue(exactValues, datesQueryParamName);
        console.log('Formatted date for submission:', formattedValue);
        
        // Add a unique timestamp parameter to force a new search and bypass caching
        const uniqueFormattedValue = {
          ...formattedValue,
          _t: Date.now() // Add a timestamp to ensure URL is unique and cache isn't used
        };
        
        console.log('Adding timestamp to force fresh search:', uniqueFormattedValue);
        
        onSubmit(uniqueFormattedValue);
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
