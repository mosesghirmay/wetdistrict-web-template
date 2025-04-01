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

  const user = ensureCurrentUser(currentUser);
  
  // Check if current user has permission to post listings (i.e., is an owner)
  const isOwner = user && hasPermissionToPostListings(user);

  const extraLinks = customLinks.map((linkConfig, index) => {
    // Skip login/signup links when authenticated
    if (isAuthenticated) {
      // Check for login/signup links by name or text content
      if (
        (linkConfig.route && 
         (linkConfig.route.name === 'LoginPage' || linkConfig.route.name === 'SignupPage')) ||
        (linkConfig.text && 
         (linkConfig.text.props?.id === 'TopbarMobileMenu.loginLink' || 
          linkConfig.text.props?.id === 'TopbarMobileMenu.signupLink'))
      ) {
        return null;
      }
      
      // If user is a renter (not an owner), hide the Captains link
      if (!isOwner) {
        // Check for Captains link by route name or text content
        if (
          (linkConfig.route && linkConfig.route.name === 'CaptainsPage') ||
          (linkConfig.text && 
           (typeof linkConfig.text === 'string' && linkConfig.text.includes('Captain')) ||
           (linkConfig.text?.props?.id && 
            (linkConfig.text.props.id === 'TopbarMobileMenu.captainsLink' || 
             linkConfig.text.props.id.toLowerCase().includes('captain'))))
        ) {
          return null;
        }
      }
    }
    
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  }).filter(link => link !== null); // Filter out null links

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

  // Set inbox tab based on user role - owners see sales, renters see orders
  const inboxTab = isOwner ? 'sales' : 'orders';

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
            {/* Authenticated user menu */}
            <div className={css.accountLinksWrapper}>
              <NamedLink
                className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}
                name="InboxPage"
                params={{ tab: inboxTab }}
              >
                <FormattedMessage id="TopbarMobileMenu.inboxLink" />
                {notificationCountBadge}
              </NamedLink>
              
              {/* Only show listings management links for owners */}
              {isOwner && (
                <NamedLink
                  className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}
                  name="ManageListingsPage"
                >
                  <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
                </NamedLink>
              )}
              
              <NamedLink
                className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}
                name="ProfileSettingsPage"
              >
                <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
              </NamedLink>
              <NamedLink
                className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
                name="AccountSettingsPage"
              >
                <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
              </NamedLink>
            </div>
            
            {/* Custom links (Extra menu items) */}
            <div className={css.customLinksWrapper}>
              {extraLinks}
              
              {/* Add a boat link - shown to owners */}
              {isOwner && (
                <NamedLink className={css.navigationLink} name="NewListingPage">
                  <span className={css.menuItemBorder} />
                  <FormattedMessage id="TopbarMobileMenu.addABoatLink" />
                </NamedLink>
              )}
            </div>
            
            {/* Logout Button */}
            <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
              <FormattedMessage id="TopbarMobileMenu.logoutLink" />
            </InlineTextButton>
          </>
        ) : (
          <>
            {/* Non-authenticated user - show custom links */}
            <div className={css.customLinksWrapper}>
              {extraLinks}
              
              {/* Add a boat link - shown to non-authenticated users */}
              <NamedLink className={css.navigationLink} name="NewListingPage">
                <span className={css.menuItemBorder} />
                <FormattedMessage id="TopbarMobileMenu.addABoatLink" />
              </NamedLink>
            </div>
          </>
        )}

        <div className={css.spacer} />
      </div>
      
      <div className={css.footer}>
        {isAuthenticated ? (
          isOwner ? (
            <NamedLink className={css.createNewListingLink} name="NewListingPage">
              <FormattedMessage id="TopbarMobileMenu.newListingLink" />
            </NamedLink>
          ) : null
        ) : (
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            <FormattedMessage id="TopbarMobileMenu.newListingLink" />
          </NamedLink>
        )}
      </div>
    </div>
  );
};

export default TopbarMobileMenu;
