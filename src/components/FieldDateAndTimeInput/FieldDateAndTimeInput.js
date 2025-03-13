import React from 'react';
import PropTypes from 'prop-types';
import { FieldDateAndTimeFilter } from '../SearchFilters/FieldDateAndTimeFilter/FieldDateAndTimeFilter';

/**
 * Wrapper component that integrates FieldDateAndTimeFilter from SearchFilters 
 * for use as a regular form field component.
 */
const FieldDateAndTimeInput = props => {
  const {
    id,
    bookingStartDate,
    bookingStartTime,
    bookingEndTime,
    availableStartTimes,
    availableEndTimes,
    onBookingStartDateChange,
    onBookingStartTimeChange,
    onBookingEndTimeChange,
    timeZone,
    classes,
    calendarOnly = false,
  } = props;

  // Forward the props to the FieldDateAndTimeFilter component
  return (
    <FieldDateAndTimeFilter
      id={id}
      bookingStartDate={bookingStartDate}
      bookingStartTime={bookingStartTime}
      bookingEndTime={bookingEndTime}
      availableStartTimes={availableStartTimes || []}
      availableEndTimes={availableEndTimes || []}
      onBookingStartDateChange={onBookingStartDateChange}
      onBookingStartTimeChange={onBookingStartTimeChange}
      onBookingEndTimeChange={onBookingEndTimeChange}
      timeZone={timeZone || 'Etc/UTC'}
      classes={classes}
      calendarOnly={calendarOnly}
    />
  );
};

FieldDateAndTimeInput.defaultProps = {
  id: 'bookingDates',
  bookingStartDate: null,
  bookingStartTime: null,
  bookingEndTime: null,
  availableStartTimes: [],
  availableEndTimes: [],
  timeZone: 'Etc/UTC',
  classes: '',
  calendarOnly: false,
};

FieldDateAndTimeInput.propTypes = {
  id: PropTypes.string,
  bookingStartDate: PropTypes.object,
  bookingStartTime: PropTypes.number,
  bookingEndTime: PropTypes.number,
  availableStartTimes: PropTypes.array,
  availableEndTimes: PropTypes.array,
  onBookingStartDateChange: PropTypes.func.isRequired,
  onBookingStartTimeChange: PropTypes.func.isRequired,
  onBookingEndTimeChange: PropTypes.func.isRequired,
  timeZone: PropTypes.string,
  classes: PropTypes.string,
  calendarOnly: PropTypes.bool,
};

export default FieldDateAndTimeInput;