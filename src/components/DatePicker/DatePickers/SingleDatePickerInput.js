import React from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import Icons from '../../../components/Icons/Icons';
import css from './SingleDatepicker.module.css';

const dateFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };

const SingleDatePickerInput = ({ value, isPickerOpen, onTogglePicker, placeholder }) => {
  const intl = useIntl();
  const formattedDate = value
    ? intl.formatDate(value, dateFormatOptions)
    : placeholder || intl.formatDate(new Date(), dateFormatOptions);

  return (
    <div
      className={classNames(css.inputWrapper, { [css.open]: isPickerOpen })}
      onClick={onTogglePicker}
    >
      <Icons name="calendar" className={css.icon} />
      <span className={css.inputText}>{formattedDate}</span>
    </div>
  );
};

export default SingleDatePickerInput;