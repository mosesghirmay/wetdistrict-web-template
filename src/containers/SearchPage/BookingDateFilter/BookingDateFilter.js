import React, { Component } from 'react';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { parseDateFromISO8601, stringifyDateToISO8601 } from '../../../util/dates';

import { FieldDateController } from '../../../components';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';

import FilterPopupForSidebar from '../BookingDateRangeFilter/FilterPopupForSidebar';
import css from './BookingDateFilter.module.css';

const getDatesQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'date';
};

// Parse query parameter, which should look like "2020-05-28,2020-05-28"
// We only care about the first date in the range
const parseValue = value => {
  const rawValuesFromParams = value ? value.split(',') : [];
  const firstDate = rawValuesFromParams.length > 0 ? parseDateFromISO8601(rawValuesFromParams[0]) : null;
  return value && firstDate ? { date: firstDate } : { date: null };
};

// Format date value for the query. It's given by FieldDateController:
// { date: date }
// Note: We need to format this as a date range (date,date) for compatibility with SearchPage validation
const formatValue = (dateObj, queryParamName) => {
  const hasDate = dateObj && dateObj.date;
  if (hasDate) {
    const date = stringifyDateToISO8601(dateObj.date);
    // Format as "date,date" (same date for start and end) to match the expected format
    return { [queryParamName]: `${date},${date}` };
  }
  return { [queryParamName]: null };
};

/**
 * BookingDateFilter component
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The ID
 * @param {React.Node} [props.label] - The label
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {boolean} [props.liveEdit] - Whether to live edit
 * @param {Array<string>} [props.queryParamNames] - The query param names (e.g. ['date'])
 * @param {Function} props.onSubmit - The function to submit
 * @param {Object} [props.initialValues] - The initial values
 * @param {number} [props.contentPlacementOffset] - The content placement offset
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
export class BookingDateFilterComponent extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: true };

    this.popupControllerRef = null;
    this.plainControllerRef = null;

    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      className,
      rootClassName,
      showAsPopup = true,
      isDesktop = false,
      initialValues,
      id,
      contentPlacementOffset = 0,
      onSubmit,
      queryParamNames,
      label,
      intl,
      ...rest
    } = this.props;

    const dateQueryParamName = getDatesQueryParamName(queryParamNames);
    const initialDate =
      initialValues && initialValues[dateQueryParamName]
        ? parseValue(initialValues[dateQueryParamName])
        : { date: null };

    const isSelected = !!initialDate.date;
    const selectedDate = isSelected ? initialDate.date : null;

    const format = {
      month: 'short',
      day: 'numeric',
    };

    const formattedDate = isSelected ? intl.formatDate(selectedDate, format) : null;

    const labelForPlain = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateFilter.labelSelectedPlain' },
          {
            date: formattedDate,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateFilter.labelPlain' });

    const labelForPopup = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateFilter.labelSelectedPopup' },
          {
            date: formattedDate,
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'BookingDateFilter.labelPopup' });

    const labelSelection = isSelected
      ? intl.formatMessage(
          { id: 'BookingDateFilter.labelSelectedPopup' },
          {
            date: formattedDate,
          }
        )
      : null;

    const handleSubmit = values => {
      onSubmit(formatValue(values, dateQueryParamName));
    };

    const onClearPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onClear: () => this.popupControllerRef.onReset(null) }
        : {};

    const onCancelPopupMaybe =
      this.popupControllerRef && this.popupControllerRef.onReset
        ? { onCancel: () => this.popupControllerRef.onReset(selectedDate) }
        : {};

    const onClearPlainMaybe =
      this.plainControllerRef && this.plainControllerRef.onReset
        ? { onClear: () => this.plainControllerRef.onReset(null) }
        : {};

    return showAsPopup ? (
      <FilterPopup
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={labelForPopup}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDate}
        {...rest}
      >
        <FieldDateController
          name="date"
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopup>
    ) : isDesktop ? (
      <FilterPopupForSidebar
        className={className}
        rootClassName={rootClassName}
        popupClassName={css.popupSize}
        label={label}
        labelSelection={labelSelection}
        isSelected={isSelected}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        {...onClearPopupMaybe}
        {...onCancelPopupMaybe}
        initialValues={initialDate}
        {...rest}
      >
        <FieldDateController
          name="date"
          controllerRef={node => {
            this.popupControllerRef = node;
          }}
        />
      </FilterPopupForSidebar>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={label}
        labelSelection={labelSelection}
        labelSelectionSeparator=":"
        isSelected={isSelected}
        id={`${id}.plain`}
        liveEdit
        onSubmit={handleSubmit}
        {...onClearPlainMaybe}
        initialValues={initialDate}
        {...rest}
      >
        <FieldDateController
          name="date"
          controllerRef={node => {
            this.plainControllerRef = node;
          }}
        />
      </FilterPlain>
    );
  }
}

const BookingDateFilter = injectIntl(BookingDateFilterComponent);

export default BookingDateFilter;