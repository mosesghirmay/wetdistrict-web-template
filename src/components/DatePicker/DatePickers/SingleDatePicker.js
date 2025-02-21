import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { OutsideClickHandler } from '../../../components';
import { getISODateString, getStartOfDay, isValidDateString } from './DatePicker.helpers';
import DatePicker from './DatePicker';

import css from './SingleDatepicker.module.css';

const dateFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

export const SingleDatePicker = props => {
  const intl = useIntl();
  const element = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true); // ✅ Default to open
  const [dateData, setDateData] = useState({
    date: props.value || null,
    formatted: props.value ? intl.formatDate(props.value, dateFormatOptions) : '',
  });

  const {
    className,
    rootClassName,
    inputClassName,
    popupClassName,
    id,
    name,
    placeholderText,
    isDayBlocked,
    onChange,
    value,
    readOnly,
    ...rest
  } = props;

  // ✅ Ensure past dates are disabled
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of the day
    return date < today; // Blocks past dates
  };

  // ✅ Track mount state
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Sync state with external value updates
  useEffect(() => {
    if (mounted && value?.getTime() !== dateData?.date?.getTime()) {
      setDateData({
        date: value,
        formatted: value ? intl.formatDate(value, dateFormatOptions) : '',
      });
    }
  }, [mounted, value]);

  const pickerId = `${id}_SingleDatePicker`;

  const classes = classNames(rootClassName || css.root, className, css.outsideClickWrapper);
  const startDateMaybe =
    dateData.date instanceof Date && !isNaN(dateData.date)
      ? { startDate: getISODateString(dateData.date) }
      : {};

  // ✅ Handle Date Selection
  const handleChange = (selectedDate) => {
    if (isDateDisabled(selectedDate)) return; // Prevent past date selection

    const startOfDay = getStartOfDay(selectedDate);
    setDateData({ date: startOfDay, formatted: intl.formatDate(startOfDay, dateFormatOptions) });

    if (onChange) {
      onChange(startOfDay);
    }

    setIsOpen(true); // ✅ Keep calendar open after selection
  };

  const handleOnChangeOnInput = e => {
    const inputStr = e.target.value;
    if (!inputStr) {
      setDateData({ date: null, formatted: '' });
      return;
    }

    if (isValidDateString(inputStr)) {
      const d = new Date(inputStr);
      if (isDateDisabled(d)) {
        setDateData({ date: dateData.date, formatted: '' });
        return;
      } else {
        setDateData({ date: d, formatted: intl.formatDate(d, dateFormatOptions) });
        return;
      }
    }

    setDateData({ date: dateData.date, formatted: inputStr });
  };

  const handleBlur = () => {
    setIsOpen(true); // ✅ Keeps it open
  };

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      toggleOpen(false); // ✅ Allows closing with Escape key
    }
  };

  const handleOnKeyDownOnInput = e => {
    if (e.key === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      toggleOpen();
    }
  };

  const toggleOpen = enforcedState => {
    if (typeof enforcedState === 'boolean') {
      setIsOpen(enforcedState);
    } else {
      setIsOpen(prevState => !prevState);
    }
  };

  const inputProps = {
    type: 'text',
    onChange: handleOnChangeOnInput,
    onKeyDown: handleOnKeyDownOnInput,
    ...(readOnly ? { readOnly } : {}),
  };

  return (
    <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(true)}> {/* ✅ Keeps open */}
      <div id={pickerId} onKeyDown={handleKeyDown} ref={element}>
        <div
          className={classNames(css.inputWrapper, {
            [css.open]: isOpen,
            [inputClassName]: inputClassName,
          })}
          onClick={() => setIsOpen(true)}
        >
          <input
            id={id}
            className={classNames(css.input, {
              [css.inputPlaceholder]: !dateData.formatted,
            })}
            placeholder={
              dateData.formatted || intl.formatDate(new Date(), dateFormatOptions) // ✅ Uses selected date or today
            }
            value={dateData.formatted} // ✅ Always shows the date unless manually cleared
            {...inputProps}
          />
        </div>

        <div className={popupClassName || css.popup}>
          {isOpen && (
            <DatePicker
              range={false}
              showMonthStepper={true}
              onChange={handleChange}
              isDayBlocked={isDateDisabled} // ✅ Blocks past dates
              value={dateData.date}
              {...startDateMaybe}
              {...rest}
            />
          )}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default SingleDatePicker;
