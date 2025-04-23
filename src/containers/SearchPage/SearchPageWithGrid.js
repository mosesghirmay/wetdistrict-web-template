import React, { Component } from 'react';
import { array, bool, func, oneOf, object, shape, string, arrayOf } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useHistory, useLocation } from 'react-router-dom';
import omit from 'lodash/omit';
import classNames from 'classnames';

import { useIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

// Import the simpleyacht image for social sharing
import simpleyachtImage from '../../assets/simpleyacht.jpg';

import { createResourceLocatorString } from '../../util/routes';
import {
  isAnyFilterActive,
  isMainSearchTypeKeywords,
  getQueryParamNames,
  isOriginInUse,
} from '../../util/search';
import { parse } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, H5, Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  groupListingFieldConfigs,
  initialValues,
  searchParamsPicker,
  validUrlQueryParamsFromProps,
  validFilterParams,
  cleanSearchFromConflictingParams,
  createSearchResultSchema,
} from './SearchPage.shared';

import FilterComponent from './FilterComponent';
import MainPanelHeader from './MainPanelHeader/MainPanelHeader';
import SearchFiltersMobile from './SearchFiltersMobile/SearchFiltersMobile';
import SortBy from './SortBy/SortBy';
import SearchResultsPanel from './SearchResultsPanel/SearchResultsPanel';
import NoSearchResultsMaybe from './NoSearchResultsMaybe/NoSearchResultsMaybe';

import css from './SearchPage.module.css';
import { withViewport } from '../../util/uiHelpers';

const MODAL_BREAKPOINT = 768; // Search is in modal on mobile layout

// SortBy component has its content in dropdown-popup.
// With this offset we move the dropdown a few pixels on desktop layout.
const FILTER_DROPDOWN_OFFSET = -14;

export class SearchPageComponent extends Component {
  constructor(props) {
    super(props);
  
    this.state = {
      isMobileModalOpen: false,
      isMobileFilterOpen: false, // ✅ Ensure this exists
      currentQueryParams: validUrlQueryParamsFromProps(props),
    };
  
    this.onOpenMobileModal = this.onOpenMobileModal.bind(this);
    this.onCloseMobileModal = this.onCloseMobileModal.bind(this);
    this.handleMobileFilterToggle = this.handleMobileFilterToggle.bind(this); // ✅ Binding
  
  

    // Filter functions
    this.resetAll = this.resetAll.bind(this);
    this.getHandleChangedValueFn = this.getHandleChangedValueFn.bind(this);

    // SortBy
    this.handleSortBy = this.handleSortBy.bind(this);
  }

  // Invoked when a modal is opened from a child component,
  // for example when a filter modal is opened in mobile view
  onOpenMobileModal() {
    this.setState({ isMobileModalOpen: true });
  }

  // Invoked when a modal is closed from a child component,
  // for example when a filter modal is opened in mobile view
  onCloseMobileModal() {
    this.setState({ isMobileModalOpen: false });
  }

  // ✅ Function to handle filter button toggle
  handleMobileFilterToggle = () => {
    this.setState(prevState => ({
      isMobileFilterOpen: !prevState.isMobileFilterOpen,
    }));
  };
  
  

  // Reset all filter query parameters
  resetAll(e) {
    const { history, routeConfiguration, config } = this.props;
    const { listingFields: listingFieldsConfig } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig } = config?.search || {};

    const urlQueryParams = validUrlQueryParamsFromProps(this.props);
    const filterQueryParamNames = getQueryParamNames(listingFieldsConfig, defaultFiltersConfig);

    // Reset state
    this.setState({ currentQueryParams: {} });

    // Reset routing params
    const queryParams = omit(urlQueryParams, filterQueryParamNames);
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams));
  }

  getHandleChangedValueFn(useHistoryPush) {
    const { history, routeConfiguration, config } = this.props;
    const { listingFields: listingFieldsConfig } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig, sortConfig } = config?.search || {};

    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    return updatedURLParams => {
      const updater = prevState => {
        const { address, bounds, keywords } = urlQueryParams;
        const mergedQueryParams = { ...urlQueryParams, ...prevState.currentQueryParams };

        // Address and bounds are handled outside of MainPanel.
        // I.e. TopbarSearchForm && search by moving the map.
        // We should always trust urlQueryParams with those.
        // The same applies to keywords, if the main search type is keyword search.
        const keywordsMaybe = isMainSearchTypeKeywords(config) ? { keywords } : {};
        return {
          currentQueryParams: {
            ...mergedQueryParams,
            ...updatedURLParams,
            ...keywordsMaybe,
            address,
            bounds,
          },
        };
      };

      const callback = () => {
        if (useHistoryPush) {
          const searchParams = this.state.currentQueryParams;
          const search = cleanSearchFromConflictingParams(
            searchParams,
            listingFieldsConfig,
            defaultFiltersConfig,
            sortConfig
          );
          history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, search));
        }
      };

      this.setState(updater, callback);
    };
  }

  handleSortBy(urlParam, values) {
    const { history, routeConfiguration } = this.props;
    const urlQueryParams = validUrlQueryParamsFromProps(this.props);

    const queryParams = values
      ? { ...urlQueryParams, [urlParam]: values }
      : omit(urlQueryParams, urlParam);

    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams));
  }

  // Reset all filter query parameters
  handleResetAll(e) {
    this.resetAll(e);

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  }



  render() {
    const {
      intl,
      listings,
      location,
      onManageDisableScrolling,
      pagination,
      scrollingDisabled,
      searchInProgress,
      searchListingsError,
      searchParams,
      routeConfiguration,
      config,
      viewport,
    } = this.props;
    const isMobileLayout = true; // Force mobile layout for all screen sizes
    const { listingFields: listingFieldsConfig } = config?.listing || {};
    const { defaultFilters: defaultFiltersConfig, sortConfig } = config?.search || {};
    const activeListingTypes = config?.listing?.listingTypes.map(config => config.listingType);
    const marketplaceCurrency = config.currency;

    // Page transition might initially use values from previous search
    // urlQueryParams doesn't contain page specific url params
    // like mapSearch, page or origin (origin depends on config.maps.search.sortSearchByDistance)
    const { searchParamsAreInSync, urlQueryParams, searchParamsInURL } = searchParamsPicker(
      location.search,
      searchParams,
      listingFieldsConfig,
      defaultFiltersConfig,
      sortConfig,
      isOriginInUse(config)
    );

    const validQueryParams = validFilterParams(
      searchParamsInURL,
      listingFieldsConfig,
      defaultFiltersConfig,
      false
    );

    const isKeywordSearch = isMainSearchTypeKeywords(config);
    const defaultFilters = isKeywordSearch
      ? defaultFiltersConfig.filter(f => f.key !== 'keywords')
      : defaultFiltersConfig;
    const [customPrimaryFilters, customSecondaryFilters] = groupListingFieldConfigs(
      listingFieldsConfig,
      activeListingTypes
    );
    // Combine all filters
    let availableFilters = [
      ...customPrimaryFilters,
      ...defaultFilters,
      ...customSecondaryFilters,
    ];

    // Reorder filters to ensure date, time, guests sequence
    // First, find indexes of date, time, and guests filters
    const dateFilterIndex = availableFilters.findIndex(filter => filter.schemaType === 'dates');
    const timeFilterIndex = availableFilters.findIndex(filter => 
      filter.key === 'availability' || filter.key === 'availabilityTime' || 
      filter.key.toLowerCase().includes('time')
    );
    const guestsFilterIndex = availableFilters.findIndex(filter => 
      filter.key === 'seats' || filter.key === 'guests' || 
      filter.key.toLowerCase().includes('guest') || filter.key.toLowerCase().includes('seat')
    );

    // If we found all three filters, reorder them
    if (dateFilterIndex !== -1 && timeFilterIndex !== -1 && guestsFilterIndex !== -1) {
      // Extract the filters we want to reorder
      const dateFilter = availableFilters[dateFilterIndex];
      const timeFilter = availableFilters[timeFilterIndex];
      const guestsFilter = availableFilters[guestsFilterIndex];

      // Remove the filters from their original positions
      // We need to be careful about indices changing after removal
      // So we remove from highest index to lowest
      const indicesToRemove = [dateFilterIndex, timeFilterIndex, guestsFilterIndex].sort((a, b) => b - a);
      indicesToRemove.forEach(index => {
        availableFilters.splice(index, 1);
      });

      // Add them back in the desired order at the beginning of the array
      availableFilters = [dateFilter, timeFilter, guestsFilter, ...availableFilters];
    }

    // Selected aka active filters
    const selectedFilters = validFilterParams(
      validQueryParams,
      listingFieldsConfig,
      defaultFiltersConfig
    );
    const isValidDatesFilter =
      searchParamsInURL.dates == null ||
      (searchParamsInURL.dates != null && searchParamsInURL.dates === selectedFilters.dates);
    const keysOfSelectedFilters = Object.keys(selectedFilters);
    const selectedFiltersCountForMobile = isKeywordSearch
      ? keysOfSelectedFilters.filter(f => f !== 'keywords').length
      : keysOfSelectedFilters.length;

    const hasPaginationInfo = !!pagination && pagination.totalItems != null;
    const totalItems =
      searchParamsAreInSync && hasPaginationInfo
        ? pagination.totalItems
        : pagination?.paginationUnsupported
        ? listings.length
        : 0;
    const listingsAreLoaded =
      !searchInProgress &&
      searchParamsAreInSync &&
      !!(hasPaginationInfo || pagination?.paginationUnsupported);

    const conflictingFilterActive = isAnyFilterActive(
      sortConfig.conflictingFilters,
      validQueryParams,
      listingFieldsConfig,
      defaultFiltersConfig
    );
    const sortBy = mode => {
      return sortConfig.active ? (
        <SortBy
          sort={validQueryParams[sortConfig.queryParamName]}
          isConflictingFilterActive={!!conflictingFilterActive}
          hasConflictingFilters={!!(sortConfig.conflictingFilters?.length > 0)}
          selectedFilters={selectedFilters}
          onSelect={this.handleSortBy}
          showAsPopup
          mode={mode}
          contentPlacementOffset={FILTER_DROPDOWN_OFFSET}
        />
      ) : null;
    };
    const noResultsInfo = (
      <NoSearchResultsMaybe
        listingsAreLoaded={listingsAreLoaded}
        totalItems={totalItems}
        location={location}
        resetAll={this.resetAll}
      />
    );

    const { title, description, schema } = createSearchResultSchema(
      listings,
      searchParamsInURL || {},
      intl,
      routeConfiguration,
      config
    );

    // Set topbar class based on if a modal is open in
    // a child component
    const topbarClasses = this.state.isMobileModalOpen
      ? classNames(css.topbarBehindModal, css.topbar)
      : css.topbar;

    // N.B. openMobileMap button is sticky.
    // For some reason, stickyness doesn't work on Safari, if the element is <button>
    // Create absolute URL for social sharing image to ensure it works in text messages
    const marketplaceRootURL = config.marketplaceRootURL || '';
    const absoluteImageURL = `${marketplaceRootURL}${simpleyachtImage}`;
    
    // Custom social sharing configuration
    const socialSharing = {
      title: 'Wet District Yacht Tours and Luxury Boat Rentals',
      description: 'Book your dream yacht experience with Wet District. Luxury boat rentals and yacht tours in Miami.',
      images1200: [
        {
          url: absoluteImageURL,
          width: 1200,
          height: 630,
        }
      ],
      images600: [
        {
          url: absoluteImageURL,
          width: 600,
          height: 314,
        }
      ],
    };

    // Force only the mobile layout
    return (
      <Page
        scrollingDisabled={scrollingDisabled}
        description={description}
        title={title}
        schema={schema}
        socialSharing={socialSharing}
        openGraphType="website"
        className="mobileOnlyLayout"
      >
        <div className={css.layoutWrapperContainer}>
          <div className={css.layoutWrapperMain}>
            <div className={css.searchResultContainer}>
              <div className={css.mobileSec}>
                <TopbarContainer rootClassName={topbarClasses} currentSearchParams={urlQueryParams} />
                <SearchFiltersMobile
                  className={css.searchFiltersMobileList}
                  urlQueryParams={validQueryParams}
                  sortByComponent={sortBy('mobile')}
                  listingsAreLoaded={listingsAreLoaded}
                  resultsCount={totalItems}
                  intl={intl}
                  searchInProgress={searchInProgress}
                  searchListingsError={searchListingsError}
                  showAsModalMaxWidth={MODAL_BREAKPOINT}
                  onManageDisableScrolling={onManageDisableScrolling}
                  onOpenModal={this.onOpenMobileModal}
                  onCloseModal={this.onCloseMobileModal}
                  resetAll={this.resetAll}
                  selectedFiltersCount={selectedFiltersCountForMobile}
                  isMapVariant={false}
                  noResultsInfo={noResultsInfo}
                  routeConfiguration={this.props.routeConfiguration}
                  history={this.props.history}
                >
                  {/* 1. Date filter */}
                  {availableFilters
                    .filter(config => config.key === 'dates')
                    .map(config => (
                      <FilterComponent
                        key={`SearchFiltersMobile.${config.scope || 'built-in'}.${config.key}`}
                        idPrefix="SearchFiltersMobile"
                        id="datesFilter"
                        config={config}
                        marketplaceCurrency={marketplaceCurrency}
                        urlQueryParams={validQueryParams}
                        initialValues={initialValues(this.props, this.state.currentQueryParams)}
                        getHandleChangedValueFn={this.getHandleChangedValueFn}
                        intl={intl}
                        liveEdit
                        showAsPopup={false}
                        isSearchFiltersMobile={true}
                        plainClassName="datesFilterHeader"
                      />
                    ))}
                  
                  {/* 3. Guests filter */}
                  {availableFilters
                    .filter(config => config.key === 'seats')
                    .map(config => (
                      <FilterComponent
                        key={`SearchFiltersMobile.${config.scope || 'built-in'}.${config.key}`}
                        idPrefix="SearchFiltersMobile"
                        id="maxguestFilter"
                        config={config}
                        marketplaceCurrency={marketplaceCurrency}
                        urlQueryParams={validQueryParams}
                        initialValues={initialValues(this.props, this.state.currentQueryParams)}
                        getHandleChangedValueFn={this.getHandleChangedValueFn}
                        intl={intl}
                        liveEdit
                        showAsPopup={false}
                        isSearchFiltersMobile={true}
                        plainClassName="guestsFilterHeader"
                      />
                    ))}
                    
                  {/* All other filters except date and seats */}
                  {availableFilters
                    .filter(config => 
                      config.key !== 'dates' && 
                      config.key !== 'seats'
                    )
                    .map(config => (
                      <FilterComponent
                        key={`SearchFiltersMobile.${config.scope || 'built-in'}.${config.key}`}
                        idPrefix="SearchFiltersMobile"
                        config={config}
                        marketplaceCurrency={marketplaceCurrency}
                        urlQueryParams={validQueryParams}
                        initialValues={initialValues(this.props, this.state.currentQueryParams)}
                        getHandleChangedValueFn={this.getHandleChangedValueFn}
                        intl={intl}
                        liveEdit
                        showAsPopup={false}
                        isSearchFiltersMobile={true}
                      />
                    ))}
                </SearchFiltersMobile>
              </div>
              
              <div
                className={classNames(css.listingsForGridVariant, {
                  [css.newSearchInProgress]: !(listingsAreLoaded || searchListingsError),
                })}
              >
                {searchListingsError ? (
                  <H3 className={css.error}>
                    <FormattedMessage id="SearchPage.searchError" />
                  </H3>
                ) : null}
                {!isValidDatesFilter ? (
                  <H5>
                    <FormattedMessage id="SearchPage.invalidDatesFilter" />
                  </H5>
                ) : null}
                <SearchResultsPanel
                  className={css.searchListingsPanel}
                  listings={listings}
                  pagination={listingsAreLoaded ? pagination : null}
                  search={parse(location.search)}
                  isMapVariant={false}
                />
              </div>
            </div>
          </div>
        </div>
        <FooterContainer />
      </Page>
    );
  }
}

SearchPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
};

SearchPageComponent.propTypes = {
  listings: array,
  onManageDisableScrolling: func.isRequired,
  pagination: propTypes.pagination,
  scrollingDisabled: bool.isRequired,
  searchInProgress: bool.isRequired,
  searchListingsError: propTypes.error,
  searchParams: object,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useLocation
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedSearchPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  return (
    <SearchPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    searchInProgress,
    searchListingsError,
    searchParams,
  } = state.SearchPage;
  const listings = getListingsById(state, currentPageResultIds);

  return {
    listings,
    pagination,
    scrollingDisabled: isScrollingDisabled(state),
    searchInProgress,
    searchListingsError,
    searchParams,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const SearchPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withViewport
)(EnhancedSearchPage);

export default SearchPage;
