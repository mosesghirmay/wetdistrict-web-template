import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { getStartOf, isInRange } from '../../../util/dates';
import { ValidationError } from '../../../components';

import SingleDatePicker from '../DatePickers/SingleDatePicker';
import css from './FieldSingleDatePicker.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 768;

const handleChange = (parentOnChange, fieldOnChange) => value => {
  if (parentOnChange) parentOnChange({ date: value });
  fieldOnChange({ date: value });
};

const FieldSingleDatePickerComponent = ({
  className,
  rootClassName,
  id,
  label,
  showLabelAsDisabled,
  input,
  meta,
  useMobileMargins,
  showErrorMessage,
  onChange: parentOnChange,
  isDayBlocked = day => false,
  isOutsideRange,
  ...rest
}) => {
  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { onChange: fieldOnChange, value, ...restOfInput } = input;

  const inputProps = {
    id,
    onChange: handleChange(parentOnChange, fieldOnChange),
    useMobileMargins,
    readOnly: typeof window !== 'undefined' && window.innerWidth < MAX_MOBILE_SCREEN_WIDTH,
    isDayBlocked: day => isOutsideRange(day) || isDayBlocked(day),
    value: value?.date,
    ...restOfInput,
    ...rest,
  };

  return (
    <div className={classNames(rootClassName || css.fieldRoot, className)}>
      {label && (
        <label
          className={classNames({
            [css.mobileMargins]: useMobileMargins,
            [css.labelDisabled]: showLabelAsDisabled,
          })}
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <SingleDatePicker {...inputProps} />
      {showErrorMessage && <ValidationError className={classNames({ [css.mobileMargins]: useMobileMargins })} fieldMeta={meta} />}
    </div>
  );
};

/**
 * A Final Form single date picker component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom CSS class for root container
 * @param {string} [props.rootClassName] - Override default root class
 * @param {string} [props.id] - The ID of the input
 * @param {string} [props.label] - Label for the input
 * @param {boolean} [props.showLabelAsDisabled] - Whether to visually disable the label
 * @param {boolean} [props.useMobileMargins] - Expands input to full width on mobile
 * @param {Function} [props.isOutsideRange] - Function to block dates outside range
 * @param {Function} [props.isDayBlocked] - Function to block specific days
 * @param {Function} [props.onChange] - Callback when the date is changed
 * @param {number} [props.firstDayOfWeek] - First day of the week (0-6)
 * @returns {JSX.Element} Final Form date picker field
 */
const FieldSingleDatePicker = ({ isOutsideRange, firstDayOfWeek, ...rest }) => {
  const config = useConfiguration();

  const defaultIsOutsideRange = day => {
    const endOfRange = config.stripe?.dayCountAvailableForBooking;
    const start = getStartOf(new Date(), 'day');
    const end = getStartOf(start, 'day', null, endOfRange, 'days');
    return !isInRange(day, start, end, 'day');
  };

  return (
    <Field
      component={FieldSingleDatePickerComponent}
      isOutsideRange={isOutsideRange || defaultIsOutsideRange}
      firstDayOfWeek={firstDayOfWeek || config.localization.firstDayOfWeek}
      {...rest}
    />
  );
};

export default FieldSingleDatePicker;
