import React, { useEffect, useState } from 'react';
import { bool, func, object, node, number, shape, string, arrayOf } from 'prop-types';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { createResourceLocatorString } from '../../../util/routes';

import { ModalInMobile, Button, } from '../../../components';
import Icons from '../../../components/Icons/Icons';


import { useMyContext } from '../../../context/StateHolder';

import css from './SearchFiltersMobile.module.css';
import { DateRangePicker } from 'react-dates';
import { stringifyDateToISO8601 } from '../../../util/dates';
import moment from 'moment';

import carIcon from './images/car.png';
import boatIcon from './images/boat.png';
import peopleIcon from './images/people.png';

const isMobileLayout = typeof window !== 'undefined' && window.innerWidth < 768;

const SearchFiltersMobile = ({
  rootClassName,
  className,
  urlQueryParams,
  children,
  sortByComponent,
  listingsAreLoaded,
  resultsCount,
  searchInProgress,
  showAsModalMaxWidth,
  onMapIconClick,
  onManageDisableScrolling,
  selectedFiltersCount,
  noResultsInfo,
  intl,
  isMapVariant,
  onOpenModal,
  onCloseModal,
  resetAll,
}) => {
  const [isFiltersOpenOnMobile, setIsFiltersOpenOnMobile] = useState(false);
  const [initialQueryParams, setInitialQueryParams] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dates, setDates] = useState({
    startDate: null,
    endDate: null,
  });
  const [focusedInput, setFocusedInput] = useState(null);

  const history = useHistory();
  const { isMobileSearchFilerOpen } = useMyContext();
  const routeConfiguration = useRouteConfiguration();

  const openFilters = () => {
    onOpenModal();
    setIsFiltersOpenOnMobile(true);
    setInitialQueryParams(urlQueryParams);
  };

  const urlQueryParamsDates = urlQueryParams?.dates;

  useEffect(() => {
    if (urlQueryParamsDates) {
      const startDate = urlQueryParamsDates.split(',')[0];
      const endDate = urlQueryParamsDates.split(',')[1];
      setDates({
        startDate: moment(startDate),
        endDate: moment(endDate),
      });
      console.log(startDate);
    }
  }, [urlQueryParamsDates]);

  console.log(urlQueryParams);
  useEffect(() => {
    if (isMobileSearchFilerOpen) {
      openFilters();
    } else {
      setIsFiltersOpenOnMobile(false);
      onCloseModal();
    }
  }, [isMobileSearchFilerOpen]);

  const cancelFilters = () => {
    history.push(
      createResourceLocatorString('SearchPage', routeConfiguration, {}, initialQueryParams)
    );
    onCloseModal();
    setIsFiltersOpenOnMobile(false);
    setInitialQueryParams(null);
  };

  const closeFilters = () => {
    onCloseModal();
    setIsFiltersOpenOnMobile(false);
  };

  const resetAllFilters = e => {
    resetAll(e);
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  };

  const classes = classNames(rootClassName || css.root, className);

  const resultsFound = (
    <FormattedMessage id="SearchFiltersMobile.foundResults" values={{ count: resultsCount }} />
  );
  const noResults = <FormattedMessage id="SearchFiltersMobile.noResults" />;
  const loadingResults = <FormattedMessage id="SearchFiltersMobile.loadingResults" />;
  const filtersHeading = intl.formatMessage({ id: 'SearchFiltersMobile.heading' });
  const modalCloseButtonMessage = intl.formatMessage({ id: 'SearchFiltersMobile.cancel' });

  const showListingsLabel = intl.formatMessage(
    { id: 'SearchFiltersMobile.showListings' },
    { count: resultsCount }
  );

  const formatValue = dates => {
    const { startDate, endDate } = dates || {};
    const start = startDate && stringifyDateToISO8601(startDate);
    const end = endDate && stringifyDateToISO8601(endDate);
    return start && end ? `${start},${end}` : null;
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setDates({ startDate, endDate });
    const dates = formatValue({ startDate, endDate });
    const extraParams = urlQueryParams ? { ...urlQueryParams, dates } : { dates };
    startDate &&
      endDate &&
      history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
  };

  const handleExtraFilters = values => {
    const extraParams = urlQueryParams ? { ...urlQueryParams, ...values } : { ...values };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
  };

  const togglePicker = () => {
    setIsPickerOpen(!isPickerOpen);
    // Automatically focus on the start date input when opening the picker
    if (!isPickerOpen) setFocusedInput('startDate');
    else setFocusedInput(null); // This will hide the picker
  };

  return (
    <div className={classes}>
      <div className={css.dateSection}>
        <div className={css.moreFilters} onClick={togglePicker}>
          <Icons name="calendar" />{' '}
          {dates?.startDate
            ? `${moment(dates?.startDate).format('DD/MM')}-${moment(dates?.endDate).format(
                'DD/MM'
              )}`
            : 'Choose a Date'}
          {isPickerOpen ? (
            <DateRangePicker
              startDate={dates?.startDate}
              startDateId="start_date"
              endDate={dates?.endDate}
              endDateId="end_date"
              onDatesChange={handleDateChange}
              focusedInput={focusedInput}
              hideKeyboardShortcutsPanel
              numberOfMonths={1}
              isOutsideRange={day => day.isBefore(moment().startOf('day'))}
              onFocusChange={focused => {
                setFocusedInput(focused);
                if (!focused) setIsPickerOpen(false); // Automatically hide picker if focus is lost
              }}
              orientation={isMobileLayout ? 'vertical' : 'horizontal'}
              navPrev=<Icons name="leftAngle" />
              navNext=<Icons name="rightAngle" />
            />
          ) : null}
        </div>
        <div
          className={css.extraFilters}
          role="button"
          onClick={() => handleExtraFilters({ pub_vessels: 'cruiser' })}
        >
          <img src={boatIcon} alt="Boat Icon" />
          <div>Rentals</div>
        </div>
        <div
          className={classNames(css.extraFilters, css.peopleIcon)}
          onClick={() => handleExtraFilters({ pub_vessels: 'yacht' })}
        >
          <img src={peopleIcon} alt="People Icon" />
          <div>Yacht Fest</div>
        </div>
        <div
          className={css.extraFilters}
          onClick={() => handleExtraFilters({ pub_vessels: 'jet-car' })}
        >
          <img src={carIcon} alt="Car Icon" />
          <div>Jet Cars</div>
        </div>
      </div>

      {noResultsInfo ? noResultsInfo : null}

      <ModalInMobile
        id="SearchFiltersMobile.filters"
        isModalOpenOnMobile={isFiltersOpenOnMobile}
        onClose={cancelFilters}
        hideCloseIcon
        showAsModalMaxWidth={showAsModalMaxWidth}
        onManageDisableScrolling={onManageDisableScrolling}
        containerClassName={css.modalContainer}
        closeButtonMessage={modalCloseButtonMessage}
        isFilterMobileModal={true}
      >
        <div className={css.modalHeadingWrapper}>
          <span className={css.modalHeading}>{filtersHeading}</span>
        </div>
        {isFiltersOpenOnMobile ? <div className={css.filtersWrapper}>{children}</div> : null}

        <div className={css.showListingsContainer}>
          <div className={css.leftactionBtns}>
            <button className={css.resetAllButton} onClick={e => resetAllFilters(e)}>
              <FormattedMessage id={'SearchFiltersMobile.resetAll'} />
            </button>
            <Button className={css.showListingsButton} onClick={closeFilters}>
              {showListingsLabel}
            </Button>
          </div>
          <span className={css.closeBtn} onClick={closeFilters}>
            <Icons name="cross" />
          </span>
        </div>
      </ModalInMobile>
    </div>
  );
};

SearchFiltersMobile.defaultProps = {
  rootClassName: null,
  className: null,
  sortByComponent: null,
  resultsCount: null,
  searchInProgress: false,
  selectedFiltersCount: 0,
  isMapVariant: true,
  onMapIconClick: () => {},
};

SearchFiltersMobile.propTypes = {
  rootClassName: string,
  className: string,
  urlQueryParams: object.isRequired,
  sortByComponent: node,
  listingsAreLoaded: bool.isRequired,
  resultsCount: number,
  searchInProgress: bool,
  showAsModalMaxWidth: number.isRequired,
  onMapIconClick: func,
  onManageDisableScrolling: func.isRequired,
  onOpenModal: func.isRequired,
  onCloseModal: func.isRequired,
  resetAll: func.isRequired,
  selectedFiltersCount: number,
  isMapVariant: bool,

  // from useIntl
  intl: intlShape.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

export default SearchFiltersMobile;