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
import { TimeAvailabilityFilter } from '../../../components/SearchFilters/TimeAvailabilityFilter';
import config from '../../../config/configSearch';

const isMobileLayout = true; // Force mobile layout for all screen sizes

const SearchFiltersMobile = ({
  rootClassName = null,
  className = null,
  urlQueryParams,
  children,
  sortByComponent = null,
  listingsAreLoaded,
  resultsCount = null,
  searchInProgress = false,
  showAsModalMaxWidth,
  onMapIconClick = () => {},
  onManageDisableScrolling,
  selectedFiltersCount = 0,
  noResultsInfo,
  intl,
  isMapVariant = true,
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

  // Handler for time filter submissions
  const handleTimeFilterSubmit = values => {
    const extraParams = urlQueryParams ? { ...urlQueryParams, ...values } : { ...values };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, extraParams));
  };

  // Time availability filter component
  const timeAvailabilityFilter = config.custom?.enableTimeAvailabilityFilter ? (
    <TimeAvailabilityFilter
      id="MobileTimeAvailabilityFilter"
      label="When"
      queryParams={urlQueryParams}
      timeZone="Etc/UTC"
      showAsPopup={false} // Show inline in mobile view
      onSubmit={handleTimeFilterSubmit}
      onClear={() => {
        const paramsWithoutTimeFilter = { ...urlQueryParams };
        delete paramsWithoutTimeFilter.availability;
        delete paramsWithoutTimeFilter.start;
        delete paramsWithoutTimeFilter.end;
        delete paramsWithoutTimeFilter.availabilityDate;
        delete paramsWithoutTimeFilter.availabilityStartTime;
        delete paramsWithoutTimeFilter.availabilityEndTime;
        history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, paramsWithoutTimeFilter));
      }}
      intl={intl}
    />
  ) : null;

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

  // Create a global function to force close the modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.forceCloseFilterModal = () => {
        console.log("Force closing filter modal via global function");
        setIsFiltersOpenOnMobile(false);
        onCloseModal();
        
        // Also try direct DOM manipulation
        const modalContainer = document.querySelector('.ReactModalPortal');
        if (modalContainer) {
          console.log("Found modal portal, removing");
          modalContainer.parentNode.removeChild(modalContainer);
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.forceCloseFilterModal;
      }
    };
  }, [onCloseModal]);
  
  // Watch for changes to the context state
  useEffect(() => {
    console.log("SearchFiltersMobile - isMobileSearchFilerOpen changed to:", isMobileSearchFilerOpen);
    
    // Only update local state if it's different from context state
    // This prevents the infinite update loop
    if (isMobileSearchFilerOpen && !isFiltersOpenOnMobile) {
      console.log("SearchFiltersMobile - opening filters");
      // Call the external functions but don't update state here
      // The openFilters function will set the state
      onOpenModal();
      setIsFiltersOpenOnMobile(true);
      setInitialQueryParams(urlQueryParams);
    } 
    else if (!isMobileSearchFilerOpen && isFiltersOpenOnMobile) {
      console.log("SearchFiltersMobile - closing filters");
      // Only update state if it needs to change
      setIsFiltersOpenOnMobile(false);
      onCloseModal();
      
      // Try to force remove the modal from the DOM
      if (typeof document !== 'undefined') {
        const modalContainer = document.querySelector('.ReactModalPortal');
        if (modalContainer) {
          console.log("Found modal portal, removing");
          modalContainer.parentNode.removeChild(modalContainer);
        }
      }
    }
  }, [isMobileSearchFilerOpen, isFiltersOpenOnMobile, onCloseModal, onOpenModal, urlQueryParams]);
  
  // Simple click handler for date filter
  useEffect(() => {
    if (!isFiltersOpenOnMobile) return;
    
    // Wait for a short delay to ensure DOM is ready
    const timerId = setTimeout(() => {
      // Get the date filter header
      const dateFilterElem = document.querySelector('.datesFilterHeader');
      
      if (!dateFilterElem) return;
      
      // Simple click listener that just opens the picker
      const clickListener = (event) => {
        console.log('Date filter clicked');
        setIsPickerOpen(true);
        
        // Stop event propagation
        event.stopPropagation();
        event.preventDefault();
      };
      
      // Add the event listener
      dateFilterElem.addEventListener('click', clickListener);
      
      return () => {
        dateFilterElem.removeEventListener('click', clickListener);
      };
    }, 100);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [isFiltersOpenOnMobile]);

  const cancelFilters = () => {
    // Get the context function from the parent component
    const { onOpenMobileSearchFilterModal } = useMyContext();
    
    // Restore URL parameters
    history.push(
      createResourceLocatorString('SearchPage', routeConfiguration, {}, initialQueryParams)
    );
    
    // Call the context function to update global state
    if (onOpenMobileSearchFilterModal) {
      console.log("SearchFiltersMobile - canceling filters via context");
      onOpenMobileSearchFilterModal(false);
    }
    
    // Also update local state
    onCloseModal();
    setIsFiltersOpenOnMobile(false);
    setInitialQueryParams(null);
    // Close date picker
    setIsPickerOpen(false);
  };

  const closeFilters = () => {
    console.log("CLOSE FILTERS CALLED");
    
    // Set global tracking variable
    if (typeof window !== 'undefined') {
      window.__isMobileFilterOpen = false;
    }
    
    // Use multiple approaches to ensure closing works
    
    // 1. Set local component state
    setIsFiltersOpenOnMobile(false);
    setIsPickerOpen(false);
    
    // 2. Call context function if available
    const { onOpenMobileSearchFilterModal } = useMyContext();
    if (onOpenMobileSearchFilterModal) {
      console.log("Closing filters via context");
      onOpenMobileSearchFilterModal(false);
    }
    
    // 3. Call provided close function
    onCloseModal();
    
    // 4. Force close with DOM manipulation (if in browser)
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('SearchFiltersMobile.filters');
      if (modal) {
        // Hide the modal
        modal.style.display = 'none';
        
        // Also try to remove classes that might make it visible
        const modalContent = modal.querySelector('div');
        if (modalContent) {
          modalContent.style.display = 'none';
        }
      }
      
      // 5. Force ESC keypress to trigger modal close behavior
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      }));
    }
    
    // 6. Use history back as a last resort
    setTimeout(() => {
      if (window.__isMobileFilterOpen === false) {
        window.history.back();
      }
    }, 200);
  };

  const classes = classNames(rootClassName || css.root, className);

  const resultsFound = (
    <FormattedMessage id="SearchFiltersMobile.foundResults" values={{ count: resultsCount }} />
  );
  const noResults = <FormattedMessage id="SearchFiltersMobile.noResults" />;
  const loadingResults = <FormattedMessage id="SearchFiltersMobile.loadingResults" />;
  const filtersHeading = intl.formatMessage({ id: 'SearchFiltersMobile.heading' });
  const modalCloseButtonMessage = intl.formatMessage({ id: 'SearchFiltersMobile.cancel' });

  // Manually set to "Yacht" / "Yachts" with capital Y as requested
  const showListingsLabel = `Show ${resultsCount} ${resultsCount === 1 ? 'Yacht' : 'Yachts'}`;

  const formatValue = dates => {
    const { startDate } = dates || {};
    if (!startDate) return null;
    
    // Convert startDate to ISO string for the beginning of the day
    const start = stringifyDateToISO8601(moment(startDate).startOf('day'));
    
    // Create endDate as the next day (for proper day booking query format)
    const end = stringifyDateToISO8601(moment(startDate).add(1, 'days').startOf('day'));
    
    // Use start date and next day for proper date range filtering
    // This format is needed for the Sharetribe API to correctly filter availability
    return `${start},${end}`;
  };

  const handleDateChange = selectedDates => {
    if (!selectedDates || !selectedDates.length || !selectedDates[0]) return;
    
    // Only store the first selected date
    const selectedDate = moment(selectedDates[0]).startOf('day');
    
    // Set both dates to the same value for data consistency
    setDates({ 
      startDate: selectedDate,
      endDate: selectedDate 
    });
    
    // Format for API: Use next day as end date (exclusive range)
    // This ensures the API interprets it as "the entire day" rather than just the specific moment
    const startDay = selectedDate.format('YYYY-MM-DD');
    const endDay = selectedDate.clone().add(1, 'days').format('YYYY-MM-DD');
    const dateParam = `${startDay},${endDay}`;
    
    console.log('Date filter parameters:', {
      startDay,
      endDay,
      dateParam
    });
    
    // Create new params, removing any time availability filter params
    // to prevent conflicts with the date filter
    const newParams = { ...urlQueryParams, dates: dateParam };
    
    // Remove time filter params if present
    delete newParams.availability;
    delete newParams.start;
    delete newParams.end;
    delete newParams.availabilityDate;
    delete newParams.availabilityStartTime;
    delete newParams.availabilityEndTime;
    delete newParams.minDuration;
    
    console.log('Setting date filter with param:', dateParam);
    
    // Push the URL update
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, newParams));
    
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
        onClose={() => {
          // Direct approach: navigate to the same page without query params
          console.log("Modal close triggered - direct close approach");
          
          // Remove query parameters
          window.location.href = window.location.pathname;
          
          // Also try calling cancelFilters as backup
          try {
            cancelFilters();
          } catch (e) {
            console.error("Error in cancelFilters", e);
          }
        }}
        hideCloseIcon={false}
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
                  
                  {/* Render TimeAvailabilityFilter directly under DatePicker */}
                  {config.custom?.enableTimeAvailabilityFilter && dates?.startDate && (
                    <div className={css.timePickerWrapper}>
                      <h3 className={css.timePickerTitle}>
                        {intl.formatMessage({ id: 'TimeAvailabilityFilter.label' })}
                      </h3>
                      <TimeAvailabilityFilter
                        id="MobileTimePickerInline"
                        queryParams={urlQueryParams}
                        timeZone="Etc/UTC"
                        showAsPopup={false}
                        onSubmit={handleTimeFilterSubmit}
                        onClear={() => {
                          const paramsWithoutTimeFilter = { ...urlQueryParams };
                          delete paramsWithoutTimeFilter.availability;
                          delete paramsWithoutTimeFilter.start;
                          delete paramsWithoutTimeFilter.end;
                          delete paramsWithoutTimeFilter.availabilityDate;
                          delete paramsWithoutTimeFilter.availabilityStartTime;
                          delete paramsWithoutTimeFilter.availabilityEndTime;
                          history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, paramsWithoutTimeFilter));
                        }}
                        intl={intl}
                      />
                    </div>
                  )}
  
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
  
            {/* This extracts the children and renders them in the desired order */}
            {React.Children.map(children, (child, index) => {
              // Check if this is the date filter (first filter)
              const isDateFilter = index === 0;
              
              if (isDateFilter) {
                // Render date filter first
                return (
                  <>
                    {child}
                    
                    {/* Render time filter immediately after date filter */}
                    {config.custom?.enableTimeAvailabilityFilter && !isPickerOpen && (
                      <div className={css.standaloneTimeFilter}>
                        {timeAvailabilityFilter}
                      </div>
                    )}
                  </>
                );
              }
              
              // Render all other children normally
              return child;
            })}
          </div>
        ) : null}
  
        <div className={css.showListingsContainer}>
          {/* Button takes 80% width */}
          <div className={css.buttonWrapper}>
            <Button 
              className={css.showListingsButton} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Show listings button clicked - FORCE CLOSING");
                
                // Use location hash directly rather than reload
                window.location.href = window.location.pathname;
              }}
            >
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

// Default props have been moved to function parameters

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