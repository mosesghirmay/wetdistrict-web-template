import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import { OutsideClickHandler } from '../../components';
import Icons from '../Icons/Icons';
import { getISODateString, getStartOfDay } from '../DatePicker/DatePickers/DatePicker.helpers';
import DatePicker from '../DatePicker/DatePickers/DatePicker';

import './CalendarOnlyFilter.css';

const dateFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

/**
 * A calendar-only date filter component with a modal popup.
 * Used for filtering listings by date in search results.
 */
const CalendarOnlyFilter = props => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const modalRef = useRef(null);
  const buttonRef = useRef(null);

  const {
    bookingStartDate,
    onBookingStartDateChange,
    formId,
    classes,
    placeholderText,
    isDayBlocked = () => false,
    isOutsideRange = date => date < new Date(),
  } = props;

  // Initialize tempDate when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTempDate(bookingStartDate);
    }
  }, [isModalOpen, bookingStartDate]);

  const openCalendarModal = () => {
    setIsModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsModalOpen(false);
  };

  const handleDateChange = value => {
    const startOfDay = getStartOfDay(value);
    setTempDate(startOfDay);
  };

  const handleApply = () => {
    if (tempDate) {
      onBookingStartDateChange(tempDate);
    }
    closeCalendarModal();
  };

  const handleCancel = () => {
    closeCalendarModal();
  };

  const handleClear = () => {
    setTempDate(null);
    onBookingStartDateChange(null);
    closeCalendarModal();
  };

  // Format the display text for the button
  // Using the full date format with weekday for better readability
  const buttonLabel = bookingStartDate 
    ? intl.formatDate(bookingStartDate, dateFormatOptions)
    : (placeholderText || intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' }));

  // Create ISO date string for DatePicker if we have a date
  const startDateMaybe =
    tempDate instanceof Date && !isNaN(tempDate)
      ? { startDate: getISODateString(tempDate) }
      : {};

  // Create a modal portal for the calendar
  const CalendarModal = () => {
    if (!isModalOpen) return null;
    
    return createPortal(
      <div className="calendarModal" onClick={handleCancel}>
        <div className="modalContent" onClick={e => e.stopPropagation()} ref={modalRef}>
          <div className="modalHeader">
            <div className="modalTitle">
              {intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' })}
            </div>
            <button className="closeButton" onClick={closeCalendarModal}>
              <Icons name="cross" />
            </button>
          </div>
          
          <div className="datePickerWrapper">
            <DatePicker
              range={false}
              showMonthStepper={true}
              onChange={handleDateChange}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isOutsideRange}
              value={tempDate}
              {...startDateMaybe}
            />
          </div>
          
          <div className="actionButtons">
            {tempDate && (
              <button 
                className="clearButton"
                onClick={handleClear}
              >
                {intl.formatMessage({ id: 'FieldDateAndTimeInput.clear' })}
              </button>
            )}
            <button className="cancelButton" onClick={handleCancel}>
              {intl.formatMessage({ id: 'FieldDateAndTimeInput.cancel' })}
            </button>
            <button 
              className="applyButton" 
              onClick={handleApply}
              disabled={!tempDate}
            >
              {intl.formatMessage({ id: 'FieldDateAndTimeInput.apply' })}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={classes}>
      <div className="formRow">
        <button 
          type="button"
          onClick={openCalendarModal}
          className="calendarButton"
          ref={buttonRef}
        >
          <Icons name="calendar" className="calendarIcon" />
          <span className="buttonText">{buttonLabel}</span>
        </button>
      </div>
      <CalendarModal />
    </div>
  );
};

// Add PropTypes for type checking
CalendarOnlyFilter.propTypes = {
  bookingStartDate: PropTypes.object,
  onBookingStartDateChange: PropTypes.func.isRequired,
  formId: PropTypes.string,
  classes: PropTypes.string,
  placeholderText: PropTypes.string,
  isDayBlocked: PropTypes.func,
  isOutsideRange: PropTypes.func,
};

export default CalendarOnlyFilter;