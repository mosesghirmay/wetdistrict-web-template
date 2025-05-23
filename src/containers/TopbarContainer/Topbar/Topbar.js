import React from 'react';
import pickBy from 'lodash/pickBy';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords, isOriginInUse } from '../../../util/search';
import { parse, stringify } from '../../../util/urlHelpers';
import { createResourceLocatorString, matchPathname, pathByRouteName } from '../../../util/routes';
import {
  Button,
  LimitedAccessBanner,
  LinkedLogo,
  Modal,
  ModalMissingInformation,
} from '../../../components';

import MenuIcon from './MenuIcon';
import SearchIcon from './SearchIcon'; // Still needed for the reference
import TopbarSearchForm from './TopbarSearchForm/TopbarSearchForm'; // Still needed for the reference
import TopbarMobileMenu from './TopbarMobileMenu/TopbarMobileMenu';
import TopbarDesktop from './TopbarDesktop/TopbarDesktop';
import { ModalInMobile } from '../../../components';

import css from './Topbar.module.css';

const MAX_MOBILE_SCREEN_WIDTH = 1024;

const SEARCH_DISPLAY_ALWAYS = 'always';
const SEARCH_DISPLAY_NOT_LANDING_PAGE = 'notLandingPage';
const SEARCH_DISPLAY_ONLY_SEARCH_PAGE = 'onlySearchPage';
const SEARCH_DISPLAY_NONE = 'none';

const redirectToURLWithModalState = (history, location, modalStateParam) => {
  const { pathname, search, state } = location;
  const searchString = `?${stringify({ [modalStateParam]: 'open', ...parse(search) })}`;
  history.push(`${pathname}${searchString}`, state);
};

const redirectToURLWithoutModalState = (history, location, modalStateParam) => {
  const { pathname, search, state } = location;
  const queryParams = pickBy(parse(search), (v, k) => {
    return k !== modalStateParam;
  });
  const stringified = stringify(queryParams);
  const searchString = stringified ? `?${stringified}` : '';
  history.push(`${pathname}${searchString}`, state);
};

const isPrimary = o => o.group === 'primary';
const isSecondary = o => o.group === 'secondary';
const compareGroups = (a, b) => {
  const isAHigherGroupThanB = isPrimary(a) && isSecondary(b);
  const isALesserGroupThanB = isSecondary(a) && isPrimary(b);
  // Note: sort order is stable in JS
  return isAHigherGroupThanB ? -1 : isALesserGroupThanB ? 1 : 0;
};
// Returns links in order where primary links are returned first
const sortCustomLinks = customLinks => {
  const links = Array.isArray(customLinks) ? customLinks : [];
  return links.sort(compareGroups);
};

// Resolves in-app links against route configuration
const getResolvedCustomLinks = (customLinks, routeConfiguration) => {
  const links = Array.isArray(customLinks) ? customLinks : [];
  return links.map(linkConfig => {
    const { type, href } = linkConfig;
    const isInternalLink = type === 'internal' || href.charAt(0) === '/';
    if (isInternalLink) {
      // Internal link
      try {
        const testURL = new URL('http://my.marketplace.com' + href);
        const matchedRoutes = matchPathname(testURL.pathname, routeConfiguration);
        if (matchedRoutes.length > 0) {
          const found = matchedRoutes[0];
          const to = { search: testURL.search, hash: testURL.hash };
          return {
            ...linkConfig,
            route: {
              name: found.route?.name,
              params: found.params,
              to,
            },
          };
        }
      } catch (e) {
        return linkConfig;
      }
    }
    return linkConfig;
  });
};

const isCMSPage = found =>
  found.route?.name === 'CMSPage' ? `CMSPage:${found.params?.pageId}` : null;
const isInboxPage = found =>
  found.route?.name === 'InboxPage' ? `InboxPage:${found.params?.tab}` : null;
// Find the name of the current route/pathname.
// It's used as handle for currentPage check.
const getResolvedCurrentPage = (location, routeConfiguration) => {
  const matchedRoutes = matchPathname(location.pathname, routeConfiguration);
  if (matchedRoutes.length > 0) {
    const found = matchedRoutes[0];
    const cmsPageName = isCMSPage(found);
    const inboxPageName = isInboxPage(found);
    return cmsPageName ? cmsPageName : inboxPageName ? inboxPageName : `${found.route?.name}`;
  }
};

const GenericError = props => {
  const { show } = props;
  const classes = classNames(css.genericError, {
    [css.genericErrorVisible]: show,
  });
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

class TopbarComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    
    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }
  

  handleSubmit(values) {
    const { currentSearchParams, history, config, routeConfiguration } = this.props;

    const topbarSearchParams = () => {
      if (isMainSearchTypeKeywords(config)) {
        return { keywords: values?.keywords };
      }
      // topbar search defaults to 'location' search
      const { search, selectedPlace } = values?.location;
      const { origin, bounds } = selectedPlace;
      const originMaybe = isOriginInUse(config) ? { origin } : {};

      return {
        ...originMaybe,
        address: search,
        bounds,
      };
    };
    const searchParams = {
      ...currentSearchParams,
      ...topbarSearchParams(),
    };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration, {}, searchParams));
  }
  

  handleLogout() {
    const { onLogout, history, routeConfiguration } = this.props;
    onLogout().then(() => {
      const path = pathByRouteName('LandingPage', routeConfiguration);

      // In production we ensure that data is really lost,
      // but in development mode we use stored values for debugging
      if (appSettings.dev) {
        history.push(path);
      } else if (typeof window !== 'undefined') {
        window.location = path;
      }

      console.log('logged out'); // eslint-disable-line
    });
  }

  render() {
    const {
      className,
      rootClassName,
      desktopClassName,
      mobileRootClassName,
      mobileClassName,
      isAuthenticated,
      isLoggedInAs,
      authScopes = [],
      authInProgress,
      currentUser,
      currentUserHasListings,
      currentUserHasOrders,
      currentPage,
      notificationCount = 0,
      intl,
      history,
      location,
      onManageDisableScrolling,
      onResendVerificationEmail,
      sendVerificationEmailInProgress,
      sendVerificationEmailError,
      showGenericError,
      config,
      routeConfiguration,
    } = this.props;


  const { mobilemenu, mobilesearch, keywords, address, origin, bounds } = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  // Custom links are sorted so that group="primary" are always at the beginning of the list.
  // Filter out any login or signup links to avoid duplicates
  const filteredLinks = (config.topbar?.customLinks || []).filter(link => {
    const linkText = (link.text || '').toLowerCase();
    const href = (link.href || '').toLowerCase();
    return !linkText.includes('login') && 
           !linkText.includes('log in') && 
           !linkText.includes('sign') && 
           !linkText.includes('signup') && 
           !href.includes('login') && 
           !href.includes('signup');
  });
  const sortedCustomLinks = sortCustomLinks(filteredLinks);
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
    />
  );

  const topbarSearcInitialValues = () => {
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
  const initialSearchFormValues = topbarSearcInitialValues();

  const classes = classNames(rootClassName || css.root, className);

  const { display: searchFormDisplay = SEARCH_DISPLAY_ALWAYS } = config?.topbar?.searchBar || {};

  // Always hide search
  const showSearchForm = false;
  const mobileSearchButtonMaybe = null;
  

  return (
    <div className={classes}>
      <LimitedAccessBanner
        isAuthenticated={isAuthenticated}
        isLoggedInAs={isLoggedInAs}
        authScopes={authScopes}
        currentUser={currentUser}
        onLogout={this.handleLogout}
        currentPage={resolvedCurrentPage}
      />
      <div className={classNames(mobileRootClassName || css.container, mobileClassName)}>
        <LinkedLogo
          layout={'mobile'}
          alt={intl.formatMessage({ id: 'Topbar.logoIcon' })}
          linkToExternalSite={config?.topbar?.logoLink}
        />
        
        {/* Centered logo */}
        <img 
          src="/images/WrittenLogo.png" 
          alt="Wet District" 
          className={css.centeredLogo} 
        />
        
        <Button
          rootClassName={css.menu}
          onClick={() => redirectToURLWithModalState(history, location, 'mobilemenu')}
          title={intl.formatMessage({ id: 'Topbar.menuIcon' })}
        >
          <MenuIcon className={css.menuIcon} />
          {notificationDot}
        </Button>
        {/* Search button removed */}
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
          showSearchForm={showSearchForm}
        />
      </div>
      <Modal
        id="TopbarMobileMenu"
        containerClassName={css.modalContainer}
        isOpen={isMobileMenuOpen}
        onClose={() => redirectToURLWithoutModalState(history, location, 'mobilemenu')}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        {authInProgress ? null : mobileMenu}
      </Modal>
      
      
      {/* Search modal removed */}
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

/**
 * Topbar containing logo, main search and navigation links.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.desktopClassName add more style rules for TopbarDesktop
 * @param {Object} props.mobileRootClassName overwrite mobile layout root classes
 * @param {Object} props.mobileClassName add more style rules for mobile layout
 * @param {boolean} props.isAuthenticated
 * @param {boolean} props.isLoggedInAs
 * @param {Object} props.currentUser
 * @param {boolean} props.currentUserHasListings
 * @param {boolean} props.currentUserHasOrders
 * @param {string} props.currentPage
 * @param {number} props.notificationCount
 * @param {Function} props.onLogout
 * @param {Function} props.onManageDisableScrolling
 * @param {Function} props.onResendVerificationEmail
 * @param {Object} props.sendVerificationEmailInProgress
 * @param {Object} props.sendVerificationEmailError
 * @param {boolean} props.showGenericError
 * @param {Object} props.history
 * @param {Function} props.history.push
 * @param {Object} props.location
 * @param {string} props.location.search '?foo=bar'
 * @returns {JSX.Element} topbar component
 */
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
