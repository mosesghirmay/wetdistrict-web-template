import React, { useState, useEffect, useCallback } from 'react';
import { array, bool, func, number, object, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import loadable from '@loadable/component';

import { propTypes } from '../../util/types';
import { sendVerificationEmail, hasCurrentUserErrors } from '../../ducks/user.duck';
import { logout, authenticationInProgress } from '../../ducks/auth.duck';
import { manageDisableScrolling } from '../../ducks/ui.duck';
import { useMyContextFunctions } from '../../context/ContextFunctions';

// Lazy load Topbar for better performance
const Topbar = loadable(() => import(/* webpackChunkName: "Topbar" */ './Topbar/Topbar'));

export const TopbarContainerComponent = ({
  authInProgress,
  currentPage = null,
  currentSearchParams = null,
  currentUser = null,
  currentUserHasListings,
  currentUserHasOrders = null,
  history,
  isAuthenticated,
  authScopes = null,
  hasGenericError,
  location,
  notificationCount = 0,
  onLogout,
  onManageDisableScrolling,
  sendVerificationEmailInProgress,
  sendVerificationEmailError = null,
  onResendVerificationEmail,
  ...rest
}) => {
  const { onOpenMobileSearchFilterModal } = useMyContextFunctions();

  // 🔹 State for managing the mobile filter menu toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 🔹 Function to toggle the filter menu - modified to always open
  const handleMobileFilterToggle = useCallback(() => {
    console.log("🔹 handleMobileFilterToggle called");
    
    // Toggle the local state for visual feedback
    setIsMobileFilterOpen(true);
    
    // Try the context function first to ALWAYS OPEN
    if (onOpenMobileSearchFilterModal) {
      console.log("🔹 Opening filter via context function");
      onOpenMobileSearchFilterModal(true);
    } else {
      // Fallback: Try to directly manipulate the DOM if context fails
      console.warn("Context function not available, using direct DOM manipulation");
      
      // Force a small delay to ensure any previous state updates have propagated
      setTimeout(() => {
        // Find the modal element
        const modal = document.getElementById('SearchFiltersMobile.filters');
        if (modal) {
          modal.style.display = 'block';
          
          // Also try to set any related classes that might control visibility
          modal.classList.add('isOpen');
          
          // Force fix z-index to ensure it's visible
          modal.style.zIndex = '99999';
        } else {
          console.error("Could not find modal element");
        }
      }, 50);
    }
  }, [onOpenMobileSearchFilterModal]);
  

  return (
    <Topbar
      authInProgress={authInProgress}
      currentPage={currentPage}
      currentSearchParams={currentSearchParams}
      currentUser={currentUser}
      currentUserHasListings={currentUserHasListings}
      currentUserHasOrders={currentUserHasOrders}
      history={history}
      isAuthenticated={isAuthenticated}
      authScopes={authScopes}
      location={location}
      notificationCount={notificationCount}
      onLogout={onLogout}
      onManageDisableScrolling={onManageDisableScrolling}
      onResendVerificationEmail={onResendVerificationEmail}
      sendVerificationEmailInProgress={sendVerificationEmailInProgress}
      sendVerificationEmailError={sendVerificationEmailError}
      showGenericError={hasGenericError}
      handleMobileFilterToggle={handleMobileFilterToggle} // ✅ Ensure this is passed
      isMobileFilterOpen={isMobileFilterOpen} // ✅ Pass the state
      {...rest}
    />
  );
};

// ✅ Prop Types
TopbarContainerComponent.propTypes = {
  authInProgress: bool.isRequired,
  currentPage: string,
  currentSearchParams: object,
  currentUser: propTypes.currentUser,
  currentUserHasListings: bool.isRequired,
  currentUserHasOrders: bool,
  isAuthenticated: bool.isRequired,
  authScopes: array,
  notificationCount: number,
  onLogout: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  sendVerificationEmailInProgress: bool.isRequired,
  sendVerificationEmailError: propTypes.error,
  onResendVerificationEmail: func.isRequired,
  hasGenericError: bool.isRequired,
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({ state: object }).isRequired,
};

// ✅ Map Redux State to Props
const mapStateToProps = state => {
  const { isAuthenticated, logoutError, authScopes } = state.auth;
  const {
    currentUser,
    currentUserHasListings,
    currentUserHasOrders,
    currentUserNotificationCount: notificationCount,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
  } = state.user;
  const hasGenericError = !!(logoutError || hasCurrentUserErrors(state));

  return {
    authInProgress: authenticationInProgress(state),
    currentUser,
    currentUserHasListings,
    currentUserHasOrders,
    notificationCount,
    isAuthenticated,
    authScopes,
    sendVerificationEmailInProgress,
    sendVerificationEmailError,
    hasGenericError,
  };
};

// ✅ Map Dispatch to Props
const mapDispatchToProps = dispatch => ({
  onLogout: historyPush => dispatch(logout(historyPush)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onResendVerificationEmail: () => dispatch(sendVerificationEmail()),
});

// ✅ Ensure `withRouter` is **outside** `connect`
const TopbarContainer = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(TopbarContainerComponent);

export default TopbarContainer;
