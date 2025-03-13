import React, { useEffect, useState } from 'react';
import { bool, func, object, node, number, shape, string, arrayOf } from 'prop-types';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { createResourceLocatorString } from '../../../util/routes';

import { ModalInMobile, Button } from '../../../components';
import EnhancedDatePicker from '../../../components/SearchFilters/EnhancedDatePicker';
import Icons from '../../../components/Icons/Icons';
import { DatePicker } from '../../../components/DatePicker';

import { useMyContext } from '../../../context/StateHolder';

import css from './SearchFiltersMobile.module.css';
import '../../../components/DatePicker/DatePickers/DatePickerSingleDateStyle.css';
import { stringifyDateToISO8601 } from '../../../util/dates';
import moment from 'moment';

import writtenLogo from '../../../assets/WrittenLogo.png';

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
  const [dates, setDates] = useState({
    startDate: null,
    endDate: null,
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const history = useHistory();
  const { isMobileSearchFilerOpen } = useMyContext();
  const routeConfiguration = useRouteConfiguration();

  const openFilters = () => {
    if (!isFiltersOpenOnMobile) {
      onOpenModal();
      setIsFiltersOpenOnMobile(true);
      setInitialQueryParams(urlQueryParams);
    }
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
    }
  }, [urlQueryParamsDates]);

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

  const handleDateChange = selectedDates => {
    if (!selectedDates || !selectedDates.length || !selectedDates[0]) return;
    
    // Use the first selected date for both startDate and endDate
    const selectedDate = moment(selectedDates[0]).startOf('day').toDate();
    
    // Set both dates to the same value
    setDates({ 
      startDate: selectedDate, 
      endDate: selectedDate 
    });
    
    // Format and update URL
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    const dateParam = `${formattedDate},${formattedDate}`;
    const extraParams = urlQueryParams 
      ? { ...urlQueryParams, dates: dateParam } 
      : { dates: dateParam };
    
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
    
    // Close the picker immediately
    setIsPickerOpen(false);
  };

  const handleClearDate = () => {
    setDates({ startDate: null, endDate: null });
    
    // Remove dates parameter from URL
    const paramsWithoutDates = { ...urlQueryParams };
    delete paramsWithoutDates.dates;
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, paramsWithoutDates));
  };

  const handleExtraFilters = values => {
    const extraParams = urlQueryParams ? { ...urlQueryParams, ...values } : { ...values };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
  };

  // This is the simple SortBy section to be added to the modal filter
  const sortBySection = (
    <div className={css.sortBySection}>
      <div>Sort By</div>
      {sortByComponent}
    </div>
  );

  return (
    <div className={classes}>
      {/* Hide the date section completely - we'll only use the modal version */}
      <div className={css.hiddenSection}>
        {/* This section is now completely hidden */}
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
          <div className={css.logoContainer}>
            <img src={writtenLogo} alt="Written Logo" className={css.logoImage} />
          </div>
        </div>
        
        {isFiltersOpenOnMobile ? (
          <div className={css.filtersWrapper}>
            {/* Sort By section - moved to top */}
            {sortBySection}
            
            {/* Enhanced Date Picker for Date Selection */}
            <div className={css.modalDatePickerContainer}>
              <h3 className={css.modalSectionTitle}>Select a Date</h3>
              <div className={css.calendarOnlyWrapper}>
                <button 
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className={css.calendarButton}
                >
                  <Icons name="calendar" className={css.calendarIcon} />
                  <span className={css.buttonText}>
                    {dates?.startDate 
                      ? intl.formatDate(dates.startDate, { weekday: 'short', month: 'short', day: 'numeric' })
                      : intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' })}
                  </span>
                </button>
                
                {isPickerOpen && (
                  <div className={css.datePickerModal} onClick={() => setIsPickerOpen(false)}>
                    <div className={css.datePickerModalContent} onClick={e => e.stopPropagation()}>
                      <div className={css.datePickerModalHeader}>
                        <div className={css.datePickerModalTitle}>
                          {intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' })}
                        </div>
                        <button className={css.closeButton} onClick={() => setIsPickerOpen(false)}>
                          <Icons name="cross" />
                        </button>
                      </div>
                      
                      <div className={css.datePickerWrapper}>
                        <DatePicker 
                          value={[dates?.startDate, dates?.endDate]}
                          onChange={handleDateChange}
                          isDayBlocked={() => false}
                          isOutsideRange={day => day.isBefore(moment().startOf('day'))}
                          range={true}
                          showMonthStepper={true}
                          theme="light"
                        />
                      </div>
                      
                      <div className={css.actionButtons}>
                        {dates?.startDate && (
                          <button 
                            className={css.clearButton}
                            onClick={() => {
                              handleClearDate();
                              setIsPickerOpen(false);
                            }}
                          >
                            {intl.formatMessage({ id: 'FieldDateAndTimeInput.clear' })}
                          </button>
                        )}
                        <button className={css.cancelButton} onClick={() => setIsPickerOpen(false)}>
                          {intl.formatMessage({ id: 'FieldDateAndTimeInput.cancel' })}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Children for additional filters */}
            {children}
          </div>
        ) : null}

        <div className={css.showListingsContainer}>
          <Button className={css.showListingsButton} onClick={closeFilters}>
            {showListingsLabel}
          </Button>
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