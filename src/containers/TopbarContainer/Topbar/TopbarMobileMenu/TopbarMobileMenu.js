import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';
import { hasPermissionToPostListings } from '../../../../util/userHelpers';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
  IconClose,
  AvatarSmall,
} from '../../../../components';

import css from './TopbarMobileMenu.module.css';
import WrittenLogo from '../../../../assets/WrittenLogo.png';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  if (type === 'internal' && route) {
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.navigationLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    currentUserHasListings,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
    onClose,
  } = props;

  // Get user type directly from publicData
  const userType = currentUser?.attributes?.profile?.publicData?.userType;
  
  // Check if the user is a renter (from publicData)
  const isRenter = userType === 'renter';
  
  // Check permissions (more reliable than just checking userType)
  const hasListingPermission = currentUser && hasPermissionToPostListings(currentUser);
  
  // User is an owner if they have permission to post listings AND they're not explicitly a renter
  const isOwner = hasListingPermission && !isRenter;

  // Filter custom links based on user type
  const filteredCustomLinks = customLinks ? customLinks.filter(linkConfig => {
    // For non-authenticated users, show all links
    if (!isAuthenticated) {
      return true;
    }
    
    // Skip login/signup links when authenticated
    if (linkConfig.route?.name === 'LoginPage' || linkConfig.route?.name === 'SignupPage') {
      return false;
    }
    
    // If user is a renter, remove owner-specific links
    if (!isOwner && (linkConfig.route?.name === 'CaptainsPage' || 
                    linkConfig.route?.name === 'ManageListingsPage' ||
                    linkConfig.route?.name === 'NewListingPage')) {
      return false;
    }
    
    return true;
  }) : [];

  const notificationCountBadge =
    notificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={notificationCount} />
    ) : null;

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  // Set inbox tab based on user role - renters see orders, others see sales
  const inboxTab = isRenter ? 'orders' : 'sales';

  return (
    <div className={css.root}>
      {/* Header with Logo */}
      <div className={css.header}>
        <div className={css.logoContainer}>
          <img src={WrittenLogo} alt="Wet District" className={css.writtenLogo} />
        </div>
      </div>

      <div className={css.content}>
        {isAuthenticated ? (
          <>
            <div className={css.accountLinksWrapper}>
              <NamedLink
                className={classNames(css.inbox)}
                name="InboxPage"
                params={{ tab: inboxTab }}
              >
                <FormattedMessage id="TopbarMobileMenu.inboxLink" />
                {notificationCountBadge}
              </NamedLink>

              {isOwner && (
                <NamedLink className={css.navigationLink} name="ManageListingsPage">
                  <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
                </NamedLink>
              )}

              <NamedLink className={css.navigationLink} name="ProfileSettingsPage">
                <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
              </NamedLink>
              <NamedLink className={css.navigationLink} name="AccountSettingsPage">
                <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
              </NamedLink>
            </div>

            <div className={css.customLinksWrapper}>
              {filteredCustomLinks.map((linkConfig, index) => (
                <CustomLinkComponent
                  key={`${linkConfig.text}_${index}`}
                  linkConfig={linkConfig}
                  currentPage={currentPage}
                />
              ))}

              {isOwner && (
                <NamedLink className={css.navigationLink} name="NewListingPage">
                  <FormattedMessage id="TopbarMobileMenu.addABoatLink" />
                </NamedLink>
              )}
            </div>

            <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
              <FormattedMessage id="TopbarMobileMenu.logoutLink" />
            </InlineTextButton>
          </>
        ) : (
          <div className={css.customLinksWrapper}>
            {filteredCustomLinks.map((linkConfig, index) => (
              <CustomLinkComponent
                key={`${linkConfig.text}_${index}`}
                linkConfig={linkConfig}
                currentPage={currentPage}
              />
            ))}
            
            {/* Add Boat link for non-authenticated users */}
            <NamedLink className={css.navigationLink} name="NewListingPage">
              <FormattedMessage id="TopbarMobileMenu.addABoatLink" />
            </NamedLink>
          </div>
        )}
      </div>

      {/* Show "Add Boat" link in footer for owners OR when nobody is logged in */}
      {(!isAuthenticated || (isAuthenticated && isOwner)) ? (
        <div className={css.footer}>
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            <FormattedMessage id="TopbarMobileMenu.newListingLink" />
          </NamedLink>
        </div>
      ) : null}
    </div>
  );
};

export default TopbarMobileMenu;