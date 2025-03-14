import React, { useEffect, useState, useRef, useCallback } from 'react';
import { bool, func, object, node, number, shape, string, arrayOf } from 'prop-types';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { createResourceLocatorString } from '../../../util/routes';

import { ModalInMobile, Button } from '../../../components';
import Icons from '../../../components/Icons/Icons';
import { FieldSingleDatePicker } from '../../../components/DatePicker';
import DatePicker from '../../../components/DatePicker/DatePickers/DatePicker';

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
      // Ensure date picker is closed when filters are opened
      setIsPickerOpen(false);
    }
  };

  const urlQueryParamsDates = urlQueryParams?.dates;

  useEffect(() => {
    if (urlQueryParamsDates) {
      // Always use comma-separated format
      const dates = urlQueryParamsDates.split(',');
      const startDate = dates[0] ? moment(dates[0]) : null;
      // For single date selection, use startDate for both
      const endDate = startDate;
      
      setDates({
        startDate,
        endDate,
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
  
  // Find the date filter element and add click handler after the modal opens
  useEffect(() => {
    if (isFiltersOpenOnMobile) {
      // Wait for the DOM to update
      setTimeout(() => {
        // Find the date filter element by its class (added via 'plainClassName' property)
        const dateFilterElem = document.querySelector('.datesFilterHeader');
        
        if (dateFilterElem) {
          // Add direct click handler to open the date picker
          const clickHandler = (e) => {
            // Only open the date picker when clicking directly on the filter, not its children
            if (e.target.closest('.datesFilterHeader') && 
                !e.target.closest('.FilterPlain_plain')) {
              setIsPickerOpen(true);
              
              // Prevent the filter from toggling when we're opening the date picker
              e.stopPropagation();
              e.preventDefault();
            }
          };
          
          // Add click event
          dateFilterElem.addEventListener('click', clickHandler);
          
          // Clean up event listener when component unmounts or filters close
          return () => {
            dateFilterElem.removeEventListener('click', clickHandler);
          };
        }
      }, 200); // Small delay to ensure DOM is updated
    }
  }, [isFiltersOpenOnMobile]);

  const cancelFilters = () => {
    history.push(
      createResourceLocatorString('SearchPage', routeConfiguration, {}, initialQueryParams)
    );
    onCloseModal();
    setIsFiltersOpenOnMobile(false);
    setInitialQueryParams(null);
    // Close date picker
    setIsPickerOpen(false);
  };

  const closeFilters = () => {
    onCloseModal();
    setIsFiltersOpenOnMobile(false);
    // Close date picker
    setIsPickerOpen(false);
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
    const { startDate } = dates || {};
    const start = startDate && stringifyDateToISO8601(startDate);
    // Use the same date for both start and end for compatibility with existing code
    return start ? `${start},${start}` : null;
  };

  const handleDateChange = selectedDates => {
    if (!selectedDates || !selectedDates.length || !selectedDates[0]) return;
    
    // Only store the first selected date
    const selectedDate = moment(selectedDates[0]).startOf('day').toDate();
    
    // Set both dates to the same value for data consistency
    setDates({ 
      startDate: selectedDate,
      endDate: selectedDate 
    });
    
    // Format and update URL - using the same date for both start and end
    const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
    const dateParam = `${formattedDate},${formattedDate}`;
    const extraParams = urlQueryParams 
      ? { ...urlQueryParams, dates: dateParam } 
      : { dates: dateParam };
    
    // Push the URL update
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
    
    // First close the modal picker
    setIsPickerOpen(false);
    
    // Use a setTimeout with 300ms delay to ensure UI has time to update
    setTimeout(() => {
      // Specifically target the datesFilter element
      const datesFilterHeader = document.querySelector('.datesFilterHeader');
      
      if (datesFilterHeader) {
        // Add the force-closed class to ensure it stays closed
        datesFilterHeader.classList.add('force-closed');
        
        // Find the plain element inside specifically to hide it
        const plainElement = datesFilterHeader.querySelector('[class*="FilterPlain_plain"]');
        if (plainElement) {
          // Remove any "isOpen" classes that might be present
          plainElement.classList.remove('FilterPlain_isOpen__uD61R');
          plainElement.classList.remove('FilterPlain_isOpen');
          
          // Hide it with direct DOM manipulation
          plainElement.style.display = 'none';
        }
      }
    }, 300);
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

  // SortBy component is now placed next to the showListingsButton

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
            {/* Enhanced Date Picker Modal */}
            {isPickerOpen && (
              <div 
                className={css.datePickerModal} 
                onClick={() => setIsPickerOpen(false)}
              >
                <div 
                  className={css.datePickerModalContent} 
                  onClick={e => e.stopPropagation()}
                >
                  <div className={css.datePickerModalHeader}>
                    <div className={css.datePickerModalTitle}>
                      {intl.formatMessage({ id: 'FieldDateAndTimeInput.selectDate' })}
                    </div>
                    <button 
                      className={css.closeButton} 
                      onClick={() => setIsPickerOpen(false)}
                    >
                      <Icons name="close" />
                    </button>
                  </div>
  
                  <div className={css.datePickerWrapper}>
                    <DatePicker
                      id="mobileDatePicker"
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
                    <button 
                      className={css.cancelButton} 
                      onClick={() => setIsPickerOpen(false)}
                    >
                      {intl.formatMessage({ id: 'FieldDateAndTimeInput.cancel' })}
                    </button>
                  </div>
                </div>
              </div>
            )}
  
            {/* Children for additional filters */}
            {children}
          </div>
        ) : null}
  
        <div className={css.showListingsContainer}>
          {/* Button takes 80% width */}
          <div className={css.buttonWrapper}>
            <Button className={css.showListingsButton} onClick={closeFilters}>
              {showListingsLabel}
            </Button>
          </div>
          
          {/* Sort By takes 20% width */}
          <div className={css.sortByWrapper}>
            {sortByComponent}
          </div>
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