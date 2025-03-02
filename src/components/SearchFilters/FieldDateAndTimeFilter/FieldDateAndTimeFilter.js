import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';

// Corrected import paths
import FieldSelect from '../../FieldSelect/FieldSelect';
import FieldSingleDatePicker from '../../DatePicker/FieldSingleDatePicker/FieldSingleDatePicker';

import css from './FieldDateAndTimeFilter.module.css';

const FieldDateAndTimeFilter = props => {
  console.log("🚀 Rendering FieldDateAndTimeFilter with props:", props);

  const {
    bookingStartDate,
    bookingStartTime,
    availableStartTimes = [], // Ensure default value
    availableEndTimes = [], // Ensure default value
    onBookingStartDateChange,
    onBookingStartTimeChange,
    onBookingEndTimeChange,
    timeZone,
    formId,
    intl,
    classes,
  } = props;

  // State to store the available times when a date is selected
  const [filteredStartTimes, setFilteredStartTimes] = useState([]);
  const [filteredEndTimes, setFilteredEndTimes] = useState([]);

  // Ensure intl is defined
  if (!intl) {
    console.error("❌ `intl` is undefined. Ensure it is correctly injected and used.");
    return <div style={{ color: 'red' }}>Error: Missing `intl` object</div>;
  }

  const startOfToday = new Date();
  const bookingEndTimeAvailable = bookingStartDate && (bookingStartTime || filteredStartTimes.length > 0);

  // Effect to update available times when a date is selected
  useEffect(() => {
    if (bookingStartDate) {
      console.log("📆 Date selected:", bookingStartDate);

      // Update available start times based on selected date
      setFilteredStartTimes([...availableStartTimes]);
      setFilteredEndTimes([...availableEndTimes]);

      console.log("✅ Updated Start Times:", availableStartTimes);
      console.log("✅ Updated End Times:", availableEndTimes);
    }
  }, [bookingStartDate, availableStartTimes, availableEndTimes]);

  return (
    <div className={classes}>
      {/* Date Picker */}
      <div className={css.formRow}>
        <div className={classNames(css.field, css.startDate)}>
          <FieldSingleDatePicker
            className={css.fieldDatePicker}
            inputClassName={css.fieldDateInput}
            popupClassName={css.fieldDatePopup}
            name="bookingStartDate"
            id={formId ? `${formId}.bookingStartDate` : 'bookingStartDate'}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.startDate' })}
            placeholderText={intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' })}
            useMobileMargins
            validate={value =>
              value ? undefined : intl.formatMessage({ id: 'BookingTimeForm.requiredDate' })
            }
            isDayBlocked={() => false}
            isOutsideRange={date => date < startOfToday} // Prevent past dates
            onChange={date => {
              console.log("📅 Date changed:", date);
              onBookingStartDateChange(date);
            }}
            onClose={() => console.log("📅 Date picker closed")}
          />
        </div>
      </div>

      {/* Start Time Selector */}
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldSelect
            name="bookingStartTime"
            id={formId ? `${formId}.bookingStartTime` : 'bookingStartTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.startTime' })}
            disabled={!bookingStartDate || filteredStartTimes.length === 0}
            onChange={e => {
              console.log("⏰ Selected Start Time:", e.target.value);
              onBookingStartTimeChange(e.target.value);
            }}
          >
            {bookingStartDate && filteredStartTimes.length > 0 ? (
              filteredStartTimes.map(p => {
                console.log("⏳ Adding Start Time Option:", p);
                return (
                  <option key={p.timestamp} value={p.timestamp}>
                    {p.timeOfDay}
                  </option>
                );
              })
            ) : (
              <option disabled>{intl.formatMessage({ id: 'BookingTimeForm.noAvailableTimes' })}</option>
            )}
          </FieldSelect>
        </div>

        <div className={bookingStartDate ? css.lineBetween : css.lineBetweenDisabled}>-</div>

        {/* End Time Selector */}
        <div className={css.field}>
          <FieldSelect
            name="bookingEndTime"
            id={formId ? `${formId}.bookingEndTime` : 'bookingEndTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.endTime' })}
            disabled={!bookingEndTimeAvailable || filteredEndTimes.length === 0}
            onChange={e => {
              console.log("🕛 Selected End Time:", e.target.value);
              onBookingEndTimeChange(e.target.value);
            }}
          >
            {bookingEndTimeAvailable && filteredEndTimes.length > 0 ? (
              filteredEndTimes
                .filter(p => bookingStartTime && p.timestamp > bookingStartTime) // Prevent selecting an end time before start
                .map(p => (
                  <option key={p.timestamp} value={p.timestamp}>
                    {p.timeOfDay}
                  </option>
                ))
            ) : (
              <option disabled>{intl.formatMessage({ id: 'BookingTimeForm.selectEndTime' })}</option>
            )}
          </FieldSelect>
        </div>
      </div>
    </div>
  );
};

// Ensure `intl` is passed properly
FieldDateAndTimeFilter.propTypes = {
  intl: PropTypes.object.isRequired,
  bookingStartDate: PropTypes.object,
  bookingStartTime: PropTypes.number,
  availableStartTimes: PropTypes.array,
  availableEndTimes: PropTypes.array,
  onBookingStartDateChange: PropTypes.func.isRequired,
  onBookingStartTimeChange: PropTypes.func.isRequired,
  onBookingEndTimeChange: PropTypes.func.isRequired,
  timeZone: PropTypes.string,
  formId: PropTypes.string,
  classes: PropTypes.string,
};

// Wrap the component with injectIntl for translations
export default injectIntl(FieldDateAndTimeFilter);
