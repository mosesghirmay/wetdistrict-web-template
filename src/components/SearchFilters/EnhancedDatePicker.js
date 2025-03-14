import React from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import Icons from '../Icons/Icons';
import css from './EnhancedDatePicker.module.css';

/**
 * EnhancedDatePicker is strictly a visual component showing selected date.
 * It has no internal calendar functionality and only toggles external DatePicker.
 */
const EnhancedDatePicker = props => {
  const intl = useIntl();
  
  const {
    className,
    value,
    isPickerOpen,
    onTogglePicker,
  } = props;

  // Format date for display
  const dateFormat = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = value 
    ? intl.formatDate(value, dateFormat) 
    : intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' });

  return (
    <div 
      className={classNames(css.root, className, isPickerOpen ? css.open : css.closed)} 
      onClick={onTogglePicker}
    >
      <Icons name="calendar" className={css.calendarIcon} />
      <span className={css.dateText}>{formattedDate}</span>
    </div>
  );
};

export default EnhancedDatePicker;