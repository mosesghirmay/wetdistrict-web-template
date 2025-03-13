import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormState } from 'react-final-form';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import { FieldDateAndTimeInput, FieldSelect } from '../../../components';
import css from './StartTimeFilter.module.css';

/**
 * An enhanced version of the StartTime filter that supports:
 * 1. Original dropdown select behavior
 * 2. Calendar-only mode that shows just a date picker button
 */
const StartTimeFilterComponent = props => {
  const {
    rootClassName,
    className,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    onSubmit,
    showAsPopup,
    options,
    intl,
    useCalendarOnly,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const formState = useFormState();

  // For calendar mode, we need to track the date
  const [selectedDate, setSelectedDate] = useState(
    initialValues && initialValues.bookingStartDate ? initialValues.bookingStartDate : null
  );

  const handleSubmit = values => {
    if (useCalendarOnly) {
      // In calendar-only mode, we only want to submit the date
      onSubmit({ bookingStartDate: selectedDate });
    } else {
      // In regular mode, handle as before
      const time = values[name];
      onSubmit({ [queryParamNames[0]]: time });
    }
  };

  // For non-calendar mode: Format options for select field
  const timeOptions = options ? options.map(option => ({
    key: option.option,
    label: option.label
  })) : [];

  if (useCalendarOnly) {
    // Calendar-only mode
    return (
      <div className={classes}>
        <FieldDateAndTimeInput
          id={id}
          bookingStartDate={selectedDate}
          onBookingStartDateChange={date => {
            setSelectedDate(date);
            onSubmit({ bookingStartDate: date });
          }}
          timeZone="Etc/UTC" // Default timezone
          classes={css.calendarInput}
          calendarOnly={true}
        />
      </div>
    );
  } else {
    // Regular dropdown select mode
    return (
      <div className={classes}>
        <FieldSelect
          className={css.select}
          id={id}
          name={name || 'startTime'}
          label={label}
          validate={() => {}}
          options={timeOptions}
          onChange={() => formState.dirty && handleSubmit(formState.values)}
        />
      </div>
    );
  }
};

StartTimeFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  showAsPopup: false,
  useCalendarOnly: false,
  options: [],
};

StartTimeFilterComponent.propTypes = {
  rootClassName: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  label: PropTypes.string,
  queryParamNames: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  showAsPopup: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  intl: intlShape.isRequired,
  useCalendarOnly: PropTypes.bool,
};

const StartTimeFilter = injectIntl(StartTimeFilterComponent);

export default StartTimeFilter;
