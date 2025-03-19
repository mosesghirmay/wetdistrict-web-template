import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
  IconClose,
  AvatarSmall, // ✅ Import Close Icon
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
    onClose, // ✅ Close button function
  } = props;

  const user = ensureCurrentUser(currentUser);

  const extraLinks = customLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

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

  const inboxTab = currentUserHasListings ? 'sales' : 'orders';

  return (
    <div className={css.root}>
      {/* Header with Logo exactly like SearchFiltersMobile */}
      <div className={css.header}>
        <div className={css.logoContainer}>
          <img src={WrittenLogo} alt="Wet District" className={css.writtenLogo} />
        </div>
      </div>

      <div className={css.content}>
        {isAuthenticated ? (
          <>
            {/* ✅ Authenticated user menu */}
            <div className={css.accountLinksWrapper}>
              <NamedLink
                className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}
                name="InboxPage"
                params={{ tab: inboxTab }}
              >
                <FormattedMessage id="TopbarMobileMenu.inboxLink" />
                {notificationCountBadge}
              </NamedLink>
              <NamedLink
                className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}
                name="ManageListingsPage"
              >
                <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
              </NamedLink>
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
            
            {/* ✅ Logout Button */}
            <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
              <FormattedMessage id="TopbarMobileMenu.logoutLink" />
            </InlineTextButton>
          </>
        ) : (
          <>
            {/* Non-authenticated user, showing nothing in content area */}
          </>
        )}

        
{/* ✅ Custom links (Extra menu items) */}
<div className={css.customLinksWrapper}>{extraLinks}</div>
        <div className={css.spacer} />
      </div>
      
      <div className={css.footer}>
        {isAuthenticated ? (
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            <FormattedMessage id="TopbarMobileMenu.newListingLink" />
          </NamedLink>
        ) : (
          <NamedLink className={css.createNewListingLink} name="LoginPage">
            <FormattedMessage id="TopbarMobileMenu.loginLink" />
          </NamedLink>
        )}
      </div>
    </div>
  );
};

export default TopbarMobileMenu;
