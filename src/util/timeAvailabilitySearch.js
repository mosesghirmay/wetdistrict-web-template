/**
 * Time Availability Filter utilities
 */

import moment from 'moment';
import { throttle } from 'lodash';

/**
 * Extract time availability filter parameters from URL parameters
 * and return them in SDK query format.
 *
 * @param {Object} params object containing URL parameters
 * @returns {Object} parameters in SDK format, empty object if no time filter
 */
export const getTimeAvailabilityFilterParams = params => {
  // If we already have processed availability parameters, use them as-is
  if (params.availability === 'time-partial' && params.start && params.end && params.minDuration) {
    return { 
      availability: params.availability, 
      start: params.start, 
      end: params.end,
      minDuration: params.minDuration
    };
  }
  
  // Check if we have raw time filter parameters that need processing
  const { availabilityDate, availabilityStartTime, availabilityEndTime } = params;
  
  if (!availabilityDate || !availabilityStartTime || !availabilityEndTime) {
    return {};
  }

  try {
    // Parse the date from ISO string
    const date = new Date(availabilityDate);
    if (isNaN(date.getTime())) {
      return {};
    }
    
    // Validate time formats
    if (!isValidTimeFormat(availabilityStartTime) || !isValidTimeFormat(availabilityEndTime)) {
      return {};
    }
    
    const [startHours, startMinutes] = availabilityStartTime.split(':').map(n => parseInt(n, 10));
    const [endHours, endMinutes] = availabilityEndTime.split(':').map(n => parseInt(n, 10));

    // Create Date objects for start and end times
    const start = new Date(date);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date(date);
    end.setHours(endHours, endMinutes, 0, 0);

    // Convert to ISO strings
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    return {
      availability: 'time-partial',
      start: startISO,
      end: endISO,
      minDuration: 180 // 3 hours in minutes
    };
  } catch (e) {
    console.error('Error parsing time availability parameters:', e);
    return {};
  }
};

/**
 * Validate time format (HH:MM)
 * 
 * @param {String} timeStr - Time string to validate
 * @returns {Boolean} True if valid format
 */
const isValidTimeFormat = (timeStr) => {
  if (!timeStr) return false;
  
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(timeStr);
};

/**
 * Calculate end time based on start time (3 hour fixed duration)
 * 
 * @param {String} startTimeStr - Start time in format "HH:MM"
 * @returns {String} End time in format "HH:MM"
 */
export const calculateEndTime = (startTimeStr) => {
  if (!startTimeStr || !isValidTimeFormat(startTimeStr)) return null;
  
  const [hours, minutes] = startTimeStr.split(':').map(n => parseInt(n, 10));
  
  // Add 3 hours to get the end time
  let endHours = hours + 3;
  const endMinutes = minutes;
  
  // Format the end time string
  return `${endHours.toString().padStart(2, '0')}:${endMinutes === 0 ? '00' : endMinutes.toString().padStart(2, '0')}`;
};

/**
 * Convert time range to availability parameters for API
 * 
 * @param {String} dateStr - Date string in format "YYYY-MM-DD"
 * @param {String} startTime - Start time in format "HH:MM"
 * @param {String} endTime - End time in format "HH:MM"
 * @returns {Object} Parameters for API call
 */
export const timeRangeToAvailabilityParameters = (dateStr, startTime, endTime) => {
  if (!dateStr || !startTime || !endTime) {
    return {};
  }
  
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return {};
  }

  try {
    // Parse the date from string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return {};
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(n => parseInt(n, 10));
    const [endHours, endMinutes] = endTime.split(':').map(n => parseInt(n, 10));

    // Create Date objects for start and end times
    const start = new Date(date);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date(date);
    end.setHours(endHours, endMinutes, 0, 0);

    // Convert to ISO strings
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    return {
      availability: 'time-partial',
      start: startISO,
      end: endISO,
      minDuration: 180
    };
  } catch (e) {
    console.error('Error creating availability parameters:', e);
    return {};
  }
};

/**
 * Format time filter values for the URL
 *
 * @param {Object} values Values from the time filter form
 * @returns {Object} Values formatted for URL parameters
 */
export const formatTimeFilterParams = values => {
  const { availabilityDate, availabilityStartTime } = values;
  
  // If any of the required params are missing, return empty object
  if (!availabilityDate || !availabilityStartTime) {
    return {};
  }
  
  try {
    // Calculate end time based on start time (3-hour fixed duration)
    const availabilityEndTime = calculateEndTime(availabilityStartTime);
    if (!availabilityEndTime) {
      return {};
    }
    
    // Parse the date
    const date = new Date(availabilityDate);
    if (isNaN(date.getTime())) {
      return {};
    }
    
    const [startHours, startMinutes] = availabilityStartTime.split(':').map(n => parseInt(n, 10));
    const [endHours, endMinutes] = availabilityEndTime.split(':').map(n => parseInt(n, 10));
    
    const startDate = new Date(date);
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endHours, endMinutes, 0, 0);
    
    // Return the parameters needed for the API call and for the URL
    return {
      availability: 'time-partial',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      minDuration: 180,
      availabilityDate,
      availabilityStartTime,
      availabilityEndTime,
    };
  } catch (e) {
    console.error('Error formatting time filter parameters:', e);
    return {};
  }
};

/**
 * Extract date and time filter parameters from URL parameters
 * and return them in human-readable format.
 *
 * @param {Object} params object containing URL parameters
 * @returns {Object} parameters in a more readable format, empty object if no time filter
 */
export const getHumanReadableTimeParams = params => {
  const { availabilityDate, availabilityStartTime, availabilityEndTime } = params;
  
  if (!availabilityDate || !availabilityStartTime || !availabilityEndTime) {
    return {};
  }
  
  try {
    // Convert to more readable format for UI display
    const dateObj = new Date(availabilityDate);
    if (isNaN(dateObj.getTime())) {
      return {};
    }
    
    const formattedDate = dateObj.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Format times
    const formatTimeStr = timeStr => {
      if (!isValidTimeFormat(timeStr)) return '';
      
      const [hours, minutes] = timeStr.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return time.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: 'numeric' 
      });
    };
    
    const startTime = formatTimeStr(availabilityStartTime);
    const endTime = formatTimeStr(availabilityEndTime);
    
    if (!startTime || !endTime) return {};
    
    return {
      dateAndTimeFilter: `${formattedDate}, ${startTime} - ${endTime}`
    };
  } catch (e) {
    console.error('Error creating human readable time params:', e);
    return {};
  }
};

/**
 * Parse time filter parameters from URL query parameters
 *
 * @param {Object} queryParams URL parameters for the page
 * @returns {Object} Extracted parameters for time filter
 */
export const parseTimeFilterParams = (queryParams) => {
  const { availabilityDate, availabilityStartTime, availabilityEndTime } = queryParams;
  return {
    date: availabilityDate || null,
    startTime: availabilityStartTime || null,
    endTime: availabilityEndTime || null
  };
};

/**
 * Add time availability filter params to URL query validation
 *
 * @param {Object} validParams Already validated URL parameters
 * @param {Object} urlParams Raw URL parameters
 * @returns {Object} Updated valid parameters including time filter params
 */
export const addTimeFilterParamsToValidation = (validParams, urlParams) => {
  return {
    ...validParams,
    availability: urlParams.availability,
    start: urlParams.start,
    end: urlParams.end,
    minDuration: urlParams.minDuration,
    availabilityDate: urlParams.availabilityDate,
    availabilityStartTime: urlParams.availabilityStartTime,
    availabilityEndTime: urlParams.availabilityEndTime,
  };
};

// Cache for memoizing filter parameter processing
const memoCache = new Map();
const MEMO_TTL = 60000; // 1 minute cache lifetime

/**
 * Integrate time availability parameters into search parameters
 * with memoization to reduce redundant processing
 *
 * @param {Object} searchParams Existing search parameters
 * @param {Object} urlParams URL parameters from the query string
 * @returns {Object} Updated search parameters with time filter included
 */
export const integrateTimeFilterToSearchParams = (searchParams, urlParams) => {
  const cacheKey = JSON.stringify({
    availabilityDate: urlParams.availabilityDate,
    availabilityStartTime: urlParams.availabilityStartTime,
    availabilityEndTime: urlParams.availabilityEndTime,
    availability: urlParams.availability,
    start: urlParams.start,
    end: urlParams.end,
    minDuration: urlParams.minDuration
  });
  
  const now = Date.now();
  const cachedItem = memoCache.get(cacheKey);
  
  if (cachedItem && now - cachedItem.timestamp < MEMO_TTL) {
    return {
      ...searchParams,
      ...cachedItem.params
    };
  }
  
  const timeParams = getTimeAvailabilityFilterParams(urlParams);
  
  // Cache the computed parameters
  memoCache.set(cacheKey, {
    params: timeParams,
    timestamp: now
  });
  
  return {
    ...searchParams,
    ...timeParams
  };
};