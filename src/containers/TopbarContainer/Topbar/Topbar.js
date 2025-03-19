import React, { Component } from 'react';
import { array, arrayOf, bool, func, number, object, shape, string } from 'prop-types';
import pickBy from 'lodash/pickBy';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';

import { FormattedMessage, intlShape, useIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords, isOriginInUse } from '../../../util/search';
import { parse, stringify } from '../../../util/urlHelpers';
import { createResourceLocatorString, matchPathname, pathByRouteName } from '../../../util/routes';
import { propTypes } from '../../../util/types';
import {
  Button,
  LimitedAccessBanner,
  LinkedLogo,
  Modal,
  ModalMissingInformation,
  NamedLink,
} from '../../../components';

import Icons from '../../../components/Icons/Icons'; // ✅ Corrected path for Icons import

import MenuIcon from './MenuIcon';
import SearchIcon from './SearchIcon';
import TopbarSearchForm from './TopbarSearchForm/TopbarSearchForm';
import TopbarMobileMenu from './TopbarMobileMenu/TopbarMobileMenu';
import TopbarDesktop from './TopbarDesktop/TopbarDesktop';

import css from './Topbar.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 1024;

const redirectToURLWithModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const searchString = `?${stringify({ [modalStateParam]: 'open', ...parse(search) })}`;
  history.push(`${pathname}${searchString}`, state);
};

const redirectToURLWithoutModalState = (props, modalStateParam) => {
  const { history, location } = props;
  const { pathname, search, state } = location;
  const queryParams = pickBy(parse(search), (v, k) => k !== modalStateParam);
  const stringified = stringify(queryParams);
  const searchString = stringified ? `?${stringified}` : '';
  history.push(`${pathname}${searchString}`, state);
};

const isPrimary = o => o.group === 'primary';
const isSecondary = o => o.group === 'secondary';
const compareGroups = (a, b) => {
  const isAHigherGroupThanB = isPrimary(a) && isSecondary(b);
  const isALesserGroupThanB = isSecondary(a) && isPrimary(b);
  return isAHigherGroupThanB ? -1 : isALesserGroupThanB ? 1 : 0;
};

const sortCustomLinks = customLinks => {
  const links = Array.isArray(customLinks) ? customLinks : [];
  return links.sort(compareGroups);
};

const getResolvedCustomLinks = (customLinks, routeConfiguration) => {
  const links = Array.isArray(customLinks) ? customLinks : [];
  return links.map(linkConfig => {
    const { type, href } = linkConfig;
    const isInternalLink = type === 'internal' || href.charAt(0) === '/';
    if (isInternalLink) {
      const testURL = new URL('http://my.marketplace.com' + href);
      const matchedRoutes = matchPathname(testURL.pathname, routeConfiguration);
      if (matchedRoutes.length > 0) {
        const found = matchedRoutes[0];
        return {
          ...linkConfig,
          route: {
            name: found.route?.name,
            params: found.params,
            to: { search: testURL.search, hash: testURL.hash },
          },
        };
      }
    }
    return linkConfig;
  });
};

const isCMSPage = found => (found.route?.name === 'CMSPage' ? `CMSPage:${found.params?.pageId}` : null);
const isInboxPage = found => (found.route?.name === 'InboxPage' ? `InboxPage:${found.params?.tab}` : null);

const getResolvedCurrentPage = (location, routeConfiguration) => {
  const matchedRoutes = matchPathname(location.pathname, routeConfiguration);
  if (matchedRoutes.length > 0) {
    const found = matchedRoutes[0];
    return isCMSPage(found) || isInboxPage(found) || `${found.route?.name}`;
  }
};

const GenericError = props => {
  const { show } = props;
  const classes = classNames(css.genericError, { [css.genericErrorVisible]: show });
  return (
    <div className={classes}>
      <div className={css.genericErrorContent}>
        <p className={css.genericErrorText}>
          <FormattedMessage id="Topbar.genericError" />
        </p>
      </div>
    </div>
  );
};

GenericError.propTypes = {
  show: bool.isRequired,
};

class TopbarComponent extends Component {
  constructor(props) {
    super(props); // ✅ Ensures `this` is correctly set

    this.state = {
      isMobileFilterOpen: false,
    };

    // ✅ Ensure all functions are properly bound
    this.handleMobileFilterToggle = this.handleMobileFilterToggle.bind(this);
    this.handleMobileMenuOpen = this.handleMobileMenuOpen.bind(this);
    this.handleMobileMenuClose = this.handleMobileMenuClose.bind(this);
    this.handleMobileSearchOpen = this.handleMobileSearchOpen.bind(this);
    this.handleMobileSearchClose = this.handleMobileSearchClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleMobileFilterMenuOpen = this.handleMobileFilterMenuOpen.bind(this);
  }

  // ✅ Ensure the function exists
  handleMobileFilterToggle() {
    this.setState(prevState => ({
      isMobileFilterOpen: !prevState.isMobileFilterOpen,
    }));
  }

  handleMobileMenuOpen() {
    redirectToURLWithModalState(this.props, 'mobilemenu');
  }

  handleMobileMenuClose() {
    redirectToURLWithoutModalState(this.props, 'mobilemenu');
  }

  handleMobileSearchOpen() {
    redirectToURLWithModalState(this.props, 'mobilesearch');
  }

  handleMobileSearchClose() {
    redirectToURLWithoutModalState(this.props, 'mobilesearch');
  }

  handleMobileFilterMenuOpen(boolean) {
    const { onToggleFilterMenu = () => {} } = this.props;
    this.setState({ isMobileFilterOpen: boolean });
    onToggleFilterMenu(boolean);
  }

  // ✅ Handles search submission
  handleSubmit(values) {
    const { currentSearchParams, history, config, routeConfiguration } = this.props;

    // Extracts search parameters based on main search type
    const topbarSearchParams = () => {
      if (isMainSearchTypeKeywords(config)) {
        return { keywords: values?.keywords };
      }
    
      // Defaults to 'location' search
      const locationData = values?.location || {};
      const { search, selectedPlace = {} } = locationData;
      const { origin, bounds } = selectedPlace;
      const originMaybe = isOriginInUse(config) ? { origin } : {};
    
      return search
        ? {
            ...originMaybe,
            address: search,
            bounds,
          }
        : {};
    };
    
    // ✅ Combine search parameters and navigate
    const searchParams = {
      ...currentSearchParams,
      ...topbarSearchParams(),
    };
    
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
    }
    
    handleLogout() {
      const { onLogout, history, routeConfiguration } = this.props;
      
      onLogout()
        .then(() => {
          const path = pathByRouteName('LandingPage', routeConfiguration);
    
          // In production we ensure that data is really lost,
          // but in development mode we use stored values for debugging
          if (appSettings.dev) {
            history.push(path);
          } else if (typeof window !== 'undefined') {
            window.location = path;
          }
    
          console.log('logged out'); // eslint-disable-line
        })
        .catch(error => {
          console.error('Logout failed:', error);
        }); // ✅ Fix: Ensure the promise chain has a `.catch()` to handle potential errors.
    }
    


render() {
    const {
      className,
      rootClassName,
      desktopClassName,
      mobileRootClassName,
      mobileClassName,
      isAuthenticated,
      authScopes,
      authInProgress,
      currentUser,
      currentUserHasListings,
      currentUserHasOrders,
      currentPage,
      notificationCount,
      intl,
      location,
      onManageDisableScrolling,
      onResendVerificationEmail,
      sendVerificationEmailInProgress,
      sendVerificationEmailError,
      showGenericError,
      config,
      routeConfiguration,
      handleMobileFilterToggle, // ✅ Ensure the function is passed
    } = this.props;

    const isSearchPage = ['/', '/s'].includes(location.pathname);

    const { mobilemenu, mobilesearch, keywords, address, origin, bounds } = parse(location.search, {
      latlng: ['origin'],
      latlngBounds: ['bounds'],
    });

    // Custom links are sorted so that group="primary" are always at the beginning of the list.
    const sortedCustomLinks = sortCustomLinks(config.topbar?.customLinks);
    const customLinks = getResolvedCustomLinks(sortedCustomLinks, routeConfiguration);
    const resolvedCurrentPage = currentPage || getResolvedCurrentPage(location, routeConfiguration);

    const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;

    const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
    const isMobileLayout = hasMatchMedia
      ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
      : true;
    const isMobileMenuOpen = isMobileLayout && mobilemenu === 'open';
    const isMobileSearchOpen = isMobileLayout && mobilesearch === 'open';

    const mobileMenu = (
      <TopbarMobileMenu
        isAuthenticated={isAuthenticated}
        currentUserHasListings={currentUserHasListings}
        currentUser={currentUser}
        onLogout={this.handleLogout}
        notificationCount={notificationCount}
        currentPage={resolvedCurrentPage}
        customLinks={customLinks}
        onClose={this.handleMobileMenuClose}
      />
    );

    const topbarSearchInitialValues = () => {
      if (isMainSearchTypeKeywords(config)) {
        return { keywords };
      }

      // Only render current search if full place object is available in the URL params
      const locationFieldsPresent = isOriginInUse(config)
        ? address && origin && bounds
        : address && bounds;

      return {
        location: locationFieldsPresent
          ? {
              search: address,
              selectedPlace: { address, origin, bounds },
            }
          : null,
      };
    };
    
    const initialSearchFormValues = topbarSearchInitialValues();

    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <LimitedAccessBanner
          isAuthenticated={isAuthenticated}
          authScopes={authScopes}
          currentUser={currentUser}
          onLogout={this.handleLogout}
          currentPage={resolvedCurrentPage}
        />
        <div className={classNames(css.topbarContainer, {
          [css.searchPageTopbar]: location.pathname === '/s'
        })}>
  {/* Left: Logo */}
  <div className={css.leftContainer}>
    <LinkedLogo
      layout={'mobile'}
      showCustomLogo
      alt={intl.formatMessage({ id: 'Topbar.logoIcon' })}
      linkToExternalSite={config?.topbar?.logoLink}
    />
  </div>

  {(location.pathname === '/s' || location.pathname === '/') && (
    <div className={css.centerContainer}>
      <Button 
        className={css.searchButton} 
        type="button" 
        onClick={this.props.handleMobileFilterToggle} // Use props directly
      >
        <Icons name="calendar" className={css.searchIcon} /> 
        Choose a date
      </Button>
    </div>
  )}

  {/* Right: Menu Button */}
  <div className={css.rightContainer}>
    <Button
      rootClassName={css.menu}
      onClick={this.handleMobileMenuOpen}
      title={intl.formatMessage({ id: 'Topbar.menuIcon' })}
    >
      <MenuIcon className={css.menuIcon} />
      {notificationDot}
    </Button>
  </div>
</div>

    
        <div className={css.desktop}>
          <TopbarDesktop
            className={desktopClassName}
            currentUserHasListings={currentUserHasListings}
            currentUser={currentUser}
            currentPage={resolvedCurrentPage}
            initialSearchFormValues={initialSearchFormValues}
            intl={intl}
            isAuthenticated={isAuthenticated}
            notificationCount={notificationCount}
            onLogout={this.handleLogout}
            onSearchSubmit={this.handleSubmit}
            config={config}
            customLinks={customLinks}
          />
        </div>
   
    
<Modal
  id="TopbarMobileMenu"
  containerClassName={css.modalContainer}
  isOpen={isMobileMenuOpen}
  onClose={this.handleMobileMenuClose}
  usePortal
  onManageDisableScrolling={onManageDisableScrolling}
  isFilterMobileModal={true}
>
  {authInProgress ? null : mobileMenu}
</Modal>
<Modal
  id="TopbarMobileSearch"
  containerClassName={css.modalContainerSearchForm}
  isOpen={isMobileSearchOpen}
  onClose={this.handleMobileSearchClose}
  usePortal
  onManageDisableScrolling={onManageDisableScrolling}
>
  <div className={css.searchContainer}>
    <TopbarSearchForm
      onSubmit={this.handleSubmit}
      initialValues={initialSearchFormValues}
      isMobile
      appConfig={config}
    />
    <p className={css.mobileHelp}>
      <FormattedMessage id="Topbar.mobileSearchHelp" />
    </p>
  </div>
</Modal>
<ModalMissingInformation
  id="MissingInformationReminder"
  containerClassName={css.missingInformationModal}
  currentUser={currentUser}
  currentUserHasListings={currentUserHasListings}
  currentUserHasOrders={currentUserHasOrders}
  location={location}
  onManageDisableScrolling={onManageDisableScrolling}
  onResendVerificationEmail={onResendVerificationEmail}
  sendVerificationEmailInProgress={sendVerificationEmailInProgress}
  sendVerificationEmailError={sendVerificationEmailError}
/>

<GenericError show={showGenericError} />
</div>
);
}
}

TopbarComponent.defaultProps = {
className: null,
rootClassName: null,
desktopClassName: null,
mobileRootClassName: null,
mobileClassName: null,
notificationCount: 0,
currentUser: null,
currentUserHasOrders: null,
currentPage: null,
sendVerificationEmailError: null,
authScopes: [],
};

TopbarComponent.propTypes = {
className: string,
rootClassName: string,
desktopClassName: string,
mobileRootClassName: string,
mobileClassName: string,
isAuthenticated: bool.isRequired,
authScopes: array,
authInProgress: bool.isRequired,
currentUser: propTypes.currentUser,
currentUserHasListings: bool.isRequired,
currentUserHasOrders: bool,
currentPage: string,
notificationCount: number,
onLogout: func.isRequired,
onManageDisableScrolling: func.isRequired,
onResendVerificationEmail: func.isRequired,
sendVerificationEmailInProgress: bool.isRequired,
sendVerificationEmailError: propTypes.error,
showGenericError: bool.isRequired,

// These are passed from Page to keep Topbar rendering aware of location changes
history: shape({
push: func.isRequired,
}).isRequired,
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

const Topbar = props => {
const config = useConfiguration();
const routeConfiguration = useRouteConfiguration();
const intl = useIntl();

return (
<TopbarComponent
  config={config}
  routeConfiguration={routeConfiguration}
  intl={intl}
  {...props}
/>
);
};

export default Topbar;
