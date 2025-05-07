import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import {
  getStartHours,
  getEndHours,
  isInRange,
  isSameDate,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  isDateSameOrAfter,
  findNextBoundary,
  timestampToDate,
  monthIdString,
  getStartOf,
  stringifyDateToISO8601,
} from '../../../util/dates';

// Fixed pickup times - adjusted for timezone (UTC-5)
// Adding 5 hours (18000000 ms) to each timestamp
const FIXED_START_TIMES = [
  { timestamp: '54000000', timeOfDay: '10:00 AM' }, // 36000000 + 18000000
  { timestamp: '68400000', timeOfDay: '2:00 PM' },  // 50400000 + 18000000
  { timestamp: '82800000', timeOfDay: '6:00 PM' },  // 64800000 + 18000000
];

// Fixed end times (1 hour after pickup) - adjusted for timezone (UTC-5)
// Adding 5 hours (18000000 ms) to each timestamp
const FIXED_END_TIMES = [
  { timestamp: '57600000', timeOfDay: '11:00 AM' }, // 39600000 + 18000000
  { timestamp: '72000000', timeOfDay: '3:00 PM' },  // 54000000 + 18000000
  { timestamp: '86400000', timeOfDay: '7:00 PM' },  // 68400000 + 18000000
];
import { propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { bookingDateRequired } from '../../../util/validators';
import { FieldSingleDatePicker, FieldSelect } from '../../../components';

import {
  TODAY,
  isToday,
  nextMonthFn,
  prevMonthFn,
  endOfRange,
  getPlaceholder,
  getMonthlyFetchRange,
  getAllTimeSlots,
  getTimeSlotsOnDate,
  getTimeSlotsOnSelectedDate,
  showNextMonthStepper,
  showPreviousMonthStepper,
} from '../booking.shared';

import css from './FieldDateAndTimeInput.module.css';

// dayCountAvailableForBooking is the maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged:
// https://stripe.com/docs/connect/account-balances#holding-funds
//
// See also the API reference for querying time slots:
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots

const getAvailableStartTimes = params => {
  // Instead of calculating available times, return fixed pickup times
  return FIXED_START_TIMES;
};

const getAvailableEndTimes = params => {
  // Instead of calculating available end times, return fixed end times
  return FIXED_END_TIMES;
};

// Simplified function to handle fixed time values
const getAllTimeValues = (
  intl,
  timeZone,
  timeSlots,
  startDate,
  selectedStartTime,
  selectedEndDate,
  selectedEndTime,
  seatsEnabled
) => {
  // Use fixed start time if provided, otherwise use first available time
  const startTime = selectedStartTime 
    ? selectedStartTime
    : FIXED_START_TIMES[0].timestamp;
  
  // Get the matching end time based on the selected start time
  let endTime;
  const index = FIXED_START_TIMES.findIndex(time => time.timestamp === startTime);
  if (index !== -1) {
    endTime = FIXED_END_TIMES[index].timestamp;
  } else {
    endTime = FIXED_END_TIMES[0].timestamp;
  }
  
  // Calculate the end date (same as start date for our use case)
  const endDate = selectedEndDate || startDate;
  
  // Find the selected time slot for seats information
  const startTimeAsDate = startTime ? timestampToDate(startTime) : null;
  const selectedTimeSlotIndex = timeSlots.findIndex(t =>
    isInRange(startTimeAsDate, t.attributes.start, t.attributes.end)
  );
  const selectedTimeSlot = selectedTimeSlotIndex >= 0 ? timeSlots[selectedTimeSlotIndex] : undefined;
  
  return { startTime, endDate, endTime, selectedTimeSlot };
};

const fetchMonthData = (
  date,
  listingId,
  dayCountAvailableForBooking,
  timeZone,
  onFetchTimeSlots
) => {
  const endOfRangeDate = endOfRange(TODAY, dayCountAvailableForBooking, timeZone);

  // Don't fetch timeSlots for past months or too far in the future
  if (isInRange(date, TODAY, endOfRangeDate)) {
    // Use "today", if the first day of given month is in the past
    const start = isDateSameOrAfter(TODAY, date) ? TODAY : date;

    // Use endOfRangeDate, if the first day of the next month is too far in the future
    const nextMonthDate = nextMonthFn(date, timeZone);
    const end = isDateSameOrAfter(nextMonthDate, endOfRangeDate)
      ? getStartOf(endOfRangeDate, 'day', timeZone)
      : nextMonthDate;

    const options = {
      extraQueryParams: {
        intervalDuration: 'P1D',
        maxPerInterval: 1,
        minDurationStartingInInterval: 60,
        perPage: 31,
        page: 1,
      },
    };

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, end, timeZone, options);
  }
};

const handleMonthClick = (
  currentMonth,
  monthlyTimeSlots,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots
) => monthFn => {
  // Callback function after month has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchMonthData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    dayCountAvailableForBooking,
    timeZone,
    onFetchTimeSlots
  );

  // If previous fetch for month data failed, try again.
  const monthId = monthIdString(currentMonth, timeZone);
  const currentMonthData = monthlyTimeSlots[monthId];
  if (currentMonthData && currentMonthData.fetchTimeSlotsError) {
    fetchMonthData(
      currentMonth,
      listingId,
      dayCountAvailableForBooking,
      timeZone,
      onFetchTimeSlots
    );
  }
};

const updateBookingFieldsOnStartDateChange = params => {
  const {
    seatsEnabled,
    formApi,
  } = params;
  
  // Use the first fixed pickup time (10:00 AM) as the default
  const startTime = FIXED_START_TIMES[0].timestamp; // 10:00 AM
  const endTime = FIXED_END_TIMES[0].timestamp; // 11:00 AM

  formApi.batch(() => {
    formApi.change('bookingStartTime', startTime);
    formApi.change('bookingEndTime', endTime);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
  return { startTime, endTime };
};

const onBookingStartDateChange = (props, setCurrentMonth) => value => {
  const {
    timeSlotsForDate,
    monthlyTimeSlots,
    timeZone,
    intl,
    form: formApi,
    handleFetchLineItems,
    seatsEnabled,
    listingId,
    onFetchTimeSlots,
  } = props;
  if (!value || !value.date) {
    formApi.batch(() => {
      formApi.change('bookingStartTime', null);
      formApi.change('bookingEndTime', null);
      if (seatsEnabled) {
        formApi.change('seats', 1);
      }
    });
    // Reset the currentMonth too if bookingStartDate is cleared
    setCurrentMonth(getStartOf(TODAY, 'month', timeZone));

    return;
  }

  // This callback function (onBookingStartDateChange) is called from DatePicker component.
  // It gets raw value as a param - browser's local time instead of time in listing's timezone.
  const startDate = timeOfDayFromLocalToTimeZone(value.date, timeZone);
  const nextDay = getStartOf(startDate, 'day', timeZone, 1, 'days');

  const timeUnit = 'hour';
  const nextBoundaryToday = findNextBoundary(new Date(), 1, timeUnit, timeZone);
  const nextBoundary = isToday(startDate, timeZone)
    ? nextBoundaryToday
    : findNextBoundary(startDate, 1, timeUnit, timeZone);
  const startLimit = isDateSameOrAfter(startDate, nextBoundaryToday) ? startDate : nextBoundary;
  const endLimit = nextDay; // Note: the endLimit could be pushed to the next day: getStartOf(nextDay, 'minute', timeZone, 300, 'minutes');
  const cachedTimeSlotsForDate =
    timeSlotsForDate[stringifyDateToISO8601(startDate, timeZone)]?.timeSlots || [];

  const commonParamsForUpdateBookingFields = {
    monthlyTimeSlots,
    startDate,
    timeZone,
    seatsEnabled,
    formApi,
    intl,
  };
  // Update booking fields with the initial time slot from the reduced set of monthly time slots.
  // Fetching date specific time slots and then line-items takes slightly longer
  const { startTime, endTime } = updateBookingFieldsOnStartDateChange({
    timeSlotsOnDate: cachedTimeSlotsForDate,
    ...commonParamsForUpdateBookingFields,
  });

  // Note: the first fetch for start-times (and line-items) is using monthlyTimeSlots.
  // This fetches all the date-specific time slots, which are update to option list asynchronously.
  onFetchTimeSlots(listingId, startLimit, endLimit, timeZone, {
    useFetchTimeSlotsForDate: true,
  }).then(timeSlots => {
    updateBookingFieldsOnStartDateChange({
      timeSlotsOnDate: timeSlots,
      ...commonParamsForUpdateBookingFields,
    });

    handleFetchLineItems({
      values: {
        bookingStartTime: startTime,
        bookingEndTime: endTime,
        seats: seatsEnabled ? 1 : undefined,
      },
    });
  });
};

const onBookingStartTimeChange = props => value => {
  const {
    form: formApi,
    handleFetchLineItems,
    seatsEnabled,
  } = props;
  
  // Find the corresponding end time based on the selected start time
  let endTime;
  const index = FIXED_START_TIMES.findIndex(time => time.timestamp === value);
  if (index !== -1) {
    endTime = FIXED_END_TIMES[index].timestamp;
  } else {
    // Default to first end time if no match found
    endTime = FIXED_END_TIMES[0].timestamp;
  }

  formApi.batch(() => {
    formApi.change('bookingEndTime', endTime);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
  handleFetchLineItems({
    values: {
      bookingStartTime: value,
      bookingEndTime: endTime,
      seats: seatsEnabled ? 1 : undefined,
    },
  });
};

const onBookingEndTimeChange = props => value => {
  const { values, handleFetchLineItems, form: formApi, seatsEnabled } = props;

  if (seatsEnabled) {
    formApi.change('seats', 1);
  }

  handleFetchLineItems({
    values: {
      bookingStartTime: values.bookingStartTime,
      bookingEndTime: value,
      seats: seatsEnabled ? 1 : undefined,
    },
  });
};

/////////////////////////////////////
// FieldDateAndTimeInput component //
/////////////////////////////////////

/**
 * @typedef {Object} MonthlyTimeSlotData
 * @property {Array<propTypes.timeSlot>} timeSlots - The time slots for the month
 * @property {propTypes.error} fetchTimeSlotsError - The error for the time slots
 * @property {boolean} fetchTimeSlotsInProgress - Whether the time slots are being fetched
 */
/**
 * @typedef {Object} TimeSlotData
 * @property {Array<propTypes.timeSlot>} timeSlots - The time slots for the month
 * @property {propTypes.error} fetchTimeSlotsError - The error for the time slots
 * @property {boolean} fetchTimeSlotsInProgress - Whether the time slots are being fetched
 * @property {number} timestamp - The timestamp of the time slot
 */
/**
 * A component that provides a date and time input for Final Forms.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.formId] - The ID of the form
 * @param {Object} [props.startDateInputProps] - The props for the start date input
 * @param {Object} [props.startTimeInputProps] - The props for the start time input
 * @param {Object} [props.endTimeInputProps] - The props for the end time input
 * @param {Object} props.form - The formApi object from Final Form
 * @param {Object} props.values - The values object from Final Form
 * @param {propTypes.uuid} [props.listingId] - The ID of the listing
 * @param {Object<string, MonthlyTimeSlotData>} [props.monthlyTimeSlots] - The monthly time slots object
 * @param {Object<string, TimeSlotData>} [props.timeSlotsForDate] - The time slots for the date
 * @param {Function} [props.onFetchTimeSlots] - The function to handle the fetching of time slots
 * @param {string} [props.timeZone] - The time zone of the listing
 * @param {number} [props.dayCountAvailableForBooking] - The number of days available for booking
 * @param {Object} [props.intl] - The intl object from react-intl
 * @returns {JSX.Element} FieldDateAndTimeInput component
 */
const FieldDateAndTimeInput = props => {
  const {
    rootClassName,
    className,
    formId,
    startDateInputProps,
    values,
    listingId,
    onFetchTimeSlots,
    monthlyTimeSlots,
    timeSlotsForDate,
    onMonthChanged,
    timeZone,
    setSeatsOptions,
    seatsEnabled,
    intl,
    dayCountAvailableForBooking,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));

  const pickerTimeSlots = getAllTimeSlots(monthlyTimeSlots, seatsEnabled);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, timeZone));
  const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  const bookingStartDate = values.bookingStartDate?.date || null;
  const bookingStartTime = values.bookingStartTime || null;
  const bookingEndDate = values.bookingEndDate?.date || null; // not used
  const bookingEndTime = values.bookingEndTime || null;

  // Currently available monthly data (reduced set of time slots data using intervalDuration: P1D)
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const minDurationStartingInDay = 60;
  const options = { minDurationStartingInDay };
  const monthlyTimeSlotsData = timeSlotsPerDate(
    startMonth,
    endMonth,
    pickerTimeSlots,
    timeZone,
    options
  );

  // Currently available date-specific data
  const bookingStartIdString = stringifyDateToISO8601(bookingStartDate, timeZone);
  const timeSlotsOnSelectedDate = timeSlotsForDate[bookingStartIdString]?.timeSlots || [];

  const timeSlotsOnDate = getTimeSlotsOnSelectedDate(
    timeSlotsOnSelectedDate,
    monthlyTimeSlots,
    bookingStartDate,
    timeZone,
    seatsEnabled,
    minDurationStartingInDay
  );

  // Use the fixed pickup times defined at the top of the file
  const availableStartTimes = FIXED_START_TIMES;

  const firstAvailableStartTime =
    availableStartTimes.length > 0 && availableStartTimes[0] && availableStartTimes[0].timestamp
      ? availableStartTimes[0].timestamp
      : null;

  const { startTime, endDate, selectedTimeSlot } = getAllTimeValues(
    intl,
    timeZone,
    timeSlotsOnDate,
    bookingStartDate,
    bookingStartTime || firstAvailableStartTime,
    bookingEndDate || bookingStartDate,
    bookingEndTime,
    seatsEnabled
  );

  const seatsOptions = selectedTimeSlot?.attributes?.seats
    ? Array.from({ length: selectedTimeSlot.attributes.seats }, (_, i) => i + 1)
    : [];

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (onMonthChanged) {
      onMonthChanged(monthId);
    }
  }, [currentMonth]);

  useEffect(() => {
    // Log time slots marked for each day for debugging
    if (
      appSettings.dev &&
      appSettings.verbose &&
      !currentMonthInProgress &&
      !nextMonthInProgress &&
      monthlyTimeSlots &&
      timeZone
    ) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const tz = timeZone;
      const nextMonth = nextMonthFn(currentMonth, tz);
      const options = { minDurationStartingInDay: 60 };
      const monthlyTimeSlotsData = timeSlotsPerDate(
        currentMonth,
        nextMonth,
        pickerTimeSlots,
        tz,
        options
      );
      const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, tz);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);

      console.log(
        `Fetched months: ${monthIdString(startMonth, tz)} ... ${monthIdString(
          lastFetchedMonth,
          tz
        )}`,
        '\nTime slots for the current month:',
        monthlyTimeSlotsData
      );
    }
  }, [currentMonth, currentMonthInProgress, nextMonthInProgress, monthlyTimeSlots, timeZone]);

  useEffect(() => {
    setSeatsOptions(seatsOptions);
  }, [selectedTimeSlot?.attributes?.seats]);

  // Use the fixed end times defined at the top of the file
  const availableEndTimes = FIXED_END_TIMES;

  const onMonthClick = handleMonthClick(
    currentMonth,
    monthlyTimeSlots,
    dayCountAvailableForBooking,
    timeZone,
    listingId,
    onFetchTimeSlots
  );

  const endOfAvailableRange = dayCountAvailableForBooking;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const startOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone);

  const isOutsideRange = day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    return (
      !isDateSameOrAfter(dayInListingTZ, startOfAvailableRangeDate) ||
      !isDateSameOrAfter(endOfAvailableRangeDate, dayInListingTZ)
    );
  };

  const isDayBlocked = day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    const dateIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const timeSlotData = monthlyTimeSlotsData[dateIdString];
    return !timeSlotData?.hasAvailability;
  };

  let placeholderTime = getPlaceholder('08:00', intl, timeZone);

  const startOfToday = getStartOf(TODAY, 'day', timeZone);
  const bookingEndTimeAvailable = bookingStartDate && (bookingStartTime || startTime);
  
  console.log('Rendering start time options:', FIXED_START_TIMES);
  console.log('Available start times:', availableStartTimes);
  console.log('Current bookingStartTime value:', bookingStartTime);
  return (
    <div className={classes}>
      <div className={css.formRow}>
        <div className={classNames(css.field, css.startDate)}>
          <FieldSingleDatePicker
            className={css.fieldDatePicker}
            inputClassName={css.fieldDateInput}
            popupClassName={css.fieldDatePopup}
            name="bookingStartDate"
            id={formId ? `${formId}.bookingStartDate` : 'bookingStartDate'}
            label={startDateInputProps.label}
            placeholderText={startDateInputProps.placeholderText}
            format={v =>
              v && v.date ? { date: timeOfDayFromTimeZoneToLocal(v.date, timeZone) } : v
            }
            parse={v =>
              v && v.date ? { date: timeOfDayFromLocalToTimeZone(v.date, timeZone) } : v
            }
            useMobileMargins
            validate={bookingDateRequired(
              intl.formatMessage({ id: 'BookingTimeForm.requiredDate' })
            )}
            isDayBlocked={isDayBlocked}
            isOutsideRange={isOutsideRange}
            showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
            showNextMonthStepper={showNextMonthStepper(
              currentMonth,
              dayCountAvailableForBooking,
              timeZone
            )}
            onMonthChange={date => {
              const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
              onMonthClick(localizedDate < currentMonth ? prevMonthFn : nextMonthFn);
              setCurrentMonth(localizedDate);
            }}
            onChange={onBookingStartDateChange(props, setCurrentMonth)}
            onClose={() => {
              setCurrentMonth(bookingStartDate || startOfToday);
            }}
            fallback={
              <div className={css.fieldDatePicker}>
                <label>{startDateInputProps.label}</label>
                <input
                  className={classNames(css.fieldDateInput, css.fieldDateInputFallback)}
                  placeholder={startDateInputProps.placeholderText}
                />
              </div>
            }
          />
        </div>
      </div>
      <div className={css.formRow}>
        <div className={css.field}>
          <FieldSelect
            name="bookingStartTime"
            id={formId ? `${formId}.bookingStartTime` : 'bookingStartTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.startTime' })}
            disabled={!bookingStartDate}
            onChange={onBookingStartTimeChange(props)}
          >
            {bookingStartDate ? (
              FIXED_START_TIMES.map(p => (
                <option key={p.timestamp} value={p.timestamp}>
                  {p.timeOfDay}
                </option>
              ))
            ) : (
              <option>{placeholderTime}</option>
            )}
          </FieldSelect>
        </div>

        <div className={bookingStartDate ? css.lineBetween : css.lineBetweenDisabled}>-</div>

        <div className={css.field}>
          <FieldSelect
            name="bookingEndTime"
            id={formId ? `${formId}.bookingEndTime` : 'bookingEndTime'}
            className={bookingStartDate ? css.fieldSelect : css.fieldSelectDisabled}
            selectClassName={bookingStartDate ? css.select : css.selectDisabled}
            label={intl.formatMessage({ id: 'FieldDateAndTimeInput.endTime' })}
            disabled={!bookingEndTimeAvailable}
            onChange={onBookingEndTimeChange(props)}
          >
            {bookingEndTimeAvailable ? (
              FIXED_END_TIMES.map(p => (
                <option key={p.timestamp} value={p.timestamp}>
                  {p.timeOfDay}
                </option>
              ))
            ) : (
              <option>{placeholderTime}</option>
            )}
          </FieldSelect>
        </div>
      </div>
      <div className={css.noteSection}>
        <p className={css.note}>* All rentals are 3 hours, additional time may be purchased during booking.</p>
        <p className={css.note}>* Pick up location in or around Washington D.C. - exact location provided after payment is complete.</p>
      </div>
    </div>
  );
};

export default FieldDateAndTimeInput;