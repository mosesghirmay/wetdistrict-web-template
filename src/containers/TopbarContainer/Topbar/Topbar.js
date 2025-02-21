import React, { useEffect, useState } from 'react'; 
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
import SearchIcon from './SearchIcon';
import TopbarSearchForm from './TopbarSearchForm/TopbarSearchForm';
import TopbarMobileMenu from './TopbarMobileMenu/TopbarMobileMenu';
import TopbarDesktop from './TopbarDesktop/TopbarDesktop';

import css from './Topbar.module.css';
import { FaRegCalendarAlt } from 'react-icons/fa'; // Import from react-icons
import SingleDatePicker from '../../../components/DatePicker/DatePickers/SingleDatePicker';

import WrittenLogo from '../../../assets/WrittenLogo.png';
import { useHistory } from "react-router-dom";  // ✅ Import useHistory




const MAX_MOBILE_SCREEN_WIDTH = 1024;

const SEARCH_DISPLAY_ALWAYS = 'always';
const SEARCH_DISPLAY_NOT_LANDING_PAGE = 'notLandingPage';
const SEARCH_DISPLAY_ONLY_SEARCH_PAGE = 'onlySearchPage';

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

const TopbarComponent = (props) => {
  const [isCalendarOpen, setCalendarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);  // ✅ Ensures selectedDate is always defined
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isDateSelected, setIsDateSelected] = useState(false); // ✅ Track date selection

  // ✅ Prevent background scrolling when Date Picker is open
  useEffect(() => {
    document.body.style.overflow = isDatePickerOpen ? 'hidden' : '';
  }, [isDatePickerOpen]);

  // ✅ Handle Date Selection
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
      setIsDateSelected(true);  // ✅ Set flag when a date is picked
    }
  

  // ✅ Open & Close Date Picker
  const handleDatePickerOpen = () => setDatePickerOpen(true);
  const handleDatePickerClose = () => setDatePickerOpen(false);
  };

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
  } = props;
  
  

const handleSingleDateSelection = (date) => {
  setSelectedDate(date); // ✅ Overwrite previous selection with new date
};

const formatStartTime = (date, time) => {
  if (!date) return null; // Ensure a date is selected

  const selectedDate = new Date(date); // Convert date string to Date object
  const [hour, minute, period] = time.match(/(\d+):(\d+) (\w+)/).slice(1);

  let hours = parseInt(hour, 10);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  selectedDate.setHours(hours, parseInt(minute, 10), 0, 0);
  return selectedDate.toISOString(); // Convert to ISO 8601 format
};


  const handleSubmit = values => {
    const { currentSearchParams, history, config, routeConfiguration } = props;
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
  };

  const handleLogout = () => {
    const { onLogout, history, routeConfiguration } = props;
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
  };

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
      onLogout={handleLogout}
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

  // Search form is shown conditionally depending on configuration and
  // the current page.
  const showSearchOnAllPages = searchFormDisplay === SEARCH_DISPLAY_ALWAYS;
  const showSearchOnSearchPage =
    searchFormDisplay === SEARCH_DISPLAY_ONLY_SEARCH_PAGE && resolvedCurrentPage === 'SearchPage';
  const showSearchNotOnLandingPage =
    searchFormDisplay === SEARCH_DISPLAY_NOT_LANDING_PAGE && resolvedCurrentPage !== 'LandingPage';

  const showSearchForm =
    showSearchOnAllPages || showSearchOnSearchPage || showSearchNotOnLandingPage;
  
  

  const mobileSearchButtonMaybe = showSearchForm ? (
    <Button
  rootClassName={css.searchMenu}
  onClick={() => redirectToURLWithModalState(history, location, 'mobilesearch')}
  title={intl.formatMessage({ id: 'Topbar.searchIcon' })}
>
  <SearchIcon className={css.searchMenuIcon} />
</Button>
) : (
  <div className={css.searchMenu} />
);

 
  return (
    <div className={classes}>
      <LimitedAccessBanner
        isAuthenticated={isAuthenticated}
        isLoggedInAs={isLoggedInAs}
        authScopes={authScopes}
        currentUser={currentUser}
        onLogout={handleLogout}
        currentPage={resolvedCurrentPage}
      />
<div 
  className={classNames(mobileRootClassName || css.container, mobileClassName)}
  style={{ backgroundColor: 'var(--colorgrey50)', opacity: 1 }}
>
        {/* Logo */}
        <LinkedLogo
          layout={'mobile'}
          alt={intl.formatMessage({ id: 'Topbar.logoIcon' })}
          linkToExternalSite={config?.topbar?.logoLink}
        />

        {/* 🔹 Date Picker Button */}
        <button 
  className={css.datePickerButton} 
  onClick={() => {
    setDatePickerOpen(true);  
    setCalendarOpen(true);  // ✅ Force it open immediately
  }}
>
  <FaRegCalendarAlt className={css.calendarIcon} />
  <span>{intl.formatMessage({ id: 'Topbar.chooseDate' }) || 'Choose a date'}</span>
</button>




{/* ✅ Full-Screen Date Picker Modal with Expanded Wrapper */}
{isDatePickerOpen && (
  <div 
    className={`${css.datePickerContainer} ${isCalendarOpen ? css.expanded : ''}`}
    style={{  
      minHeight: '700px',  /* ✅ Increase height to fit all filters */
      display: 'flex',
      flexDirection: 'column',
      transition: 'min-height 0.3s ease-in-out',
    }}
  >

    {/* ✅ useHistory Hook Inside Functional Component */}
    {(() => {
      const history = useHistory(); // ✅ Ensures it's inside a function component
      return (
        <div className={css.writtenLogoContainer}>
        <img 
          src={WrittenLogo} 
          alt="Wet District" 
          className={css.writtenLogo} 
          aria-hidden="true"
          onClick={() => {
            setDatePickerOpen(false);  // ✅ Close the modal
            history.push("/s");        // ✅ Redirect to Search Page
          }}  
          style={{ cursor: "pointer" }}  
        />
      </div>
      
      );
    })()}

    {/* ✅ Close Button */}
    <button
      className={css.datePickerCloseButton}
      onClick={() => setDatePickerOpen(false)}
    >
      CLOSE X
    </button>

    {/* ✅ Main Date Picker Wrapper */}
<div className={css.datePickerWrapper}>
  
  {/* ✅ Calendar Section */}
  <label className={css.dropdownLabel}>Date:</label>
  <SingleDatePicker
    id="TopbarCalendar"
    value={selectedDate}
    onChange={setSelectedDate}
    isOpen={isDatePickerOpen}
  />

  {/* ✅ Start Time Picker Section */}
  <div className={css.filtersWrapper}>
    <div className={css.dropdownContainer}>
      <label className={css.dropdownLabel}>Start Time:</label>
      <div className={css.buttonGroup}>
        {["10:00 AM", "2:00 PM", "6:00 PM"].map(time => (
          <button
            key={time}
            className={`${css.selectionButton} ${selectedStartTime === time ? css.selected : ''}`}
            onClick={() => setSelectedStartTime(time)}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* ✅ Moved Button: Inside Modal, Below Start Time Picker */}
  <button
    className={`${css.datePickerSubmitButton} ${selectedDate && selectedStartTime ? css.enabled : ''}`}
    disabled={!selectedDate || !selectedStartTime}
  >
    Search available boats
  </button>

</div>
  </div>
)}


        {/* Menu Button */}
        <Button
          rootClassName={css.menu}
          onClick={() => redirectToURLWithModalState(history, location, 'mobilemenu')}
          title={intl.formatMessage({ id: 'Topbar.menuIcon' })}
        >
          <MenuIcon className={css.menuIcon} />
          {notificationDot}
        </Button>

        {/* Search Button */}
        {mobileSearchButtonMaybe}
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
          onLogout={handleLogout}
          onSearchSubmit={handleSubmit}
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

      <Modal
        id="TopbarMobileSearch"
        containerClassName={css.modalContainerSearchForm}
        isOpen={isMobileSearchOpen}
        onClose={() => redirectToURLWithoutModalState(history, location, 'mobilesearch')}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <div className={css.searchContainer}>
          <TopbarSearchForm
            onSubmit={handleSubmit}
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
};

/**
 * Topbar containing logo, main search, and navigation links.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes for styling
 * @param {string} [props.rootClassName] - Overwrites the component's root class
 * @param {Object} props.desktopClassName - CSS class for TopbarDesktop styling
 * @param {Object} props.mobileRootClassName - Overwrites mobile layout root class
 * @param {Object} props.mobileClassName - Additional styles for mobile layout
 * @param {boolean} props.isAuthenticated - User authentication status
 * @param {boolean} props.isLoggedInAs - If logged in as another user type
 * @param {Object} props.currentUser - Current user object
 * @param {boolean} props.currentUserHasListings - If the user has active listings
 * @param {boolean} props.currentUserHasOrders - If the user has active orders
 * @param {string} props.currentPage - Current active page
 * @param {number} props.notificationCount - Number of unread notifications
 * @param {Function} props.onLogout - Logout function
 * @param {Function} props.onManageDisableScrolling - Disables scrolling
 * @param {Function} props.onResendVerificationEmail - Handles email verification
 * @param {boolean} props.sendVerificationEmailInProgress - Email verification loading state
 * @param {Object} props.sendVerificationEmailError - Email verification error object
 * @param {boolean} props.showGenericError - If a generic error should be shown
 * @param {Object} props.history - React Router history object
 * @param {Function} props.history.push - Redirect function
 * @param {Object} props.location - Current location object
 * @param {string} props.location.search - Query string parameters (e.g., '?foo=bar')
 * @returns {JSX.Element} - The Topbar component
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