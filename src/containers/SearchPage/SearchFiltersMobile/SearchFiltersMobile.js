import React, { Component } from 'react';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { createResourceLocatorString } from '../../../util/routes';

import { ModalInMobile, Button } from '../../../components';

// PopupOpenerButton preserved for when filter is restored
// import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';
import css from './SearchFiltersMobile.module.css';

class SearchFiltersMobileComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { isFiltersOpenOnMobile: false, initialQueryParams: null };

    this.openFilters = this.openFilters.bind(this);
    this.cancelFilters = this.cancelFilters.bind(this);
    this.closeFilters = this.closeFilters.bind(this);
    this.resetAll = this.resetAll.bind(this);
  }

  // Open filters modal, set the initial parameters to current ones
  openFilters() {
    const { onOpenModal, urlQueryParams } = this.props;
    onOpenModal();
    this.setState({ isFiltersOpenOnMobile: true, initialQueryParams: urlQueryParams });
  }

  // Close the filters by clicking cancel, revert to the initial params
  cancelFilters() {
    const { history, onCloseModal, routeConfiguration } = this.props;

    history.push(
      createResourceLocatorString(
        'SearchPage',
        routeConfiguration,
        {},
        this.state.initialQueryParams
      )
    );
    onCloseModal();
    this.setState({ isFiltersOpenOnMobile: false, initialQueryParams: null });
  }

  // Close the filter modal
  closeFilters() {
    this.props.onCloseModal();
    this.setState({ isFiltersOpenOnMobile: false });
  }

  // Reset all filter query parameters
  resetAll(e) {
    this.props.resetAll(e);

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  }

  render() {
    const {
      rootClassName,
      className,
      children,
      sortByComponent,
      listingsAreLoaded,
      resultsCount,
      searchInProgress = false,
      showAsModalMaxWidth,
      onMapIconClick = () => {},
      onManageDisableScrolling,
      selectedFiltersCount = 0,
      noResultsInfo,
      intl,
      isMapVariant = true,
    } = this.props;

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

    return (
      <div className={classes}>
        {/* Results count removed */}
        <div className={css.buttons}>
          {/* Sort — left, compact */}
          <div className={css.sortWrapper}>
            {sortByComponent}
          </div>

          {/* Middle — main CTA, gradient border */}
          <a
            href="https://wetdistrict.com/p/yachtclub"
            className={css.yachtButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={css.yachtButtonContent}>
              <span className={css.yachtButtonMain}>YACHT + POOL PARTIES</span>
              <span className={css.yachtButtonSub}>View Upcoming Events</span>
            </div>
            <span className={css.yachtButtonChevron}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 13" fill="none" width="6" height="10">
                <path d="M1 1l6 5.5L1 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </a>

          {/* Phone — icon + label, matches sort button style */}
          <a href="tel:+12028766998" className={css.phoneButton} aria-label="Call us">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.59 1 1 0 01-.25 1.01l-2.2 2.19z"/>
            </svg>
            <span className={css.phoneLabel}>Call / Text</span>
          </a>
          {isMapVariant ? (
            <div className={css.buttonWrapper}>
              <div className={css.mapIcon} onClick={onMapIconClick}>
                <FormattedMessage id="SearchFiltersMobile.openMapView" className={css.mapIconText} />
              </div>
            </div>
          ) : null}
        </div>

        {noResultsInfo ? noResultsInfo : null}

        <ModalInMobile
          id="SearchFiltersMobile.filters"
          isModalOpenOnMobile={this.state.isFiltersOpenOnMobile}
          onClose={this.cancelFilters}
          showAsModalMaxWidth={showAsModalMaxWidth}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          closeButtonMessage={modalCloseButtonMessage}
        >
          <div className={css.modalHeadingWrapper}>
            <span className={css.modalHeading}>{filtersHeading}</span>
            <button className={css.resetAllButton} onClick={e => this.resetAll(e)}>
              <FormattedMessage id={'SearchFiltersMobile.resetAll'} />
            </button>
          </div>
          {this.state.isFiltersOpenOnMobile ? (
            <div className={css.filtersWrapper}>{children}</div>
          ) : null}

          <div className={css.showListingsContainer}>
            <Button className={css.showListingsButton} onClick={this.closeFilters}>
              {showListingsLabel}
            </Button>
          </div>
        </ModalInMobile>
      </div>
    );
  }
}

/**
 * SearchFiltersMobile component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.urlQueryParams - The URL query params
 * @param {React.Node} props.sortByComponent - The sort by component
 * @param {boolean} props.listingsAreLoaded - Whether the listings are loaded
 * @param {number} props.resultsCount - The number of results
 * @param {boolean} props.searchInProgress - Whether the search is in progress
 * @param {number} props.showAsModalMaxWidth - The maximum width of the modal
 * @param {Function} props.onMapIconClick - The function to click the map icon
 * @param {Function} props.onManageDisableScrolling - The function to manage disable scrolling
 * @param {Function} props.onOpenModal - The function to open the modal
 * @param {Function} props.onCloseModal - The function to close the modal
 * @param {Function} props.resetAll - The function to reset all
 * @param {number} props.selectedFiltersCount - The number of selected filters
 * @param {boolean} props.isMapVariant - Whether the map variant is enabled
 * @returns {JSX.Element}
 */
const SearchFiltersMobile = props => {
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  return (
    <SearchFiltersMobileComponent
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      {...props}
    />
  );
};

export default SearchFiltersMobile;