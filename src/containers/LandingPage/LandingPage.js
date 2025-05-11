import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useIntl } from '../../util/reactIntl';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';

import SearchPage from '../SearchPage/SearchPageWithGrid';

const LandingPageComponent = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const {
    listings = [],
    searchParams = {},
  } = props;

  // Only create landingPageData if we have all required data
  // This will prevent the "Cannot read properties of undefined" error
  const landingPageData = config && routeConfiguration ? {
    title: config.marketplaceName || 'Marketplace',
    description: config.marketplace?.description || 'Find what you need',
    socialSharing: {
      title: config.marketplaceName || 'Marketplace',
      description: config.marketplace?.description || 'Find what you need',
      images1200: [
        {
          name: 'facebook',
          url: config.branding?.facebookImageURL,
          width: 1200,
          height: 630,
        }
      ],
      images600: [
        {
          name: 'twitter',
          url: config.branding?.twitterImageURL,
          width: 600,
          height: 314,
        }
      ]
    },
    schema: {}
  } : null;

  return <SearchPage 
    {...props} 
    config={config}
    routeConfiguration={routeConfiguration}
    landingPageData={landingPageData} 
  />;
};

const mapStateToProps = state => {
  const { currentPageResultIds = [], pagination, searchParams } = state.SearchPage || {};
  return {
    listings: getListingsById(state, currentPageResultIds || []),
    pagination,
    searchParams,
    currentUser: state.user.currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    searchInProgress: state.SearchPage?.searchInProgress,
    searchListingsError: state.SearchPage?.searchListingsError,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disable) =>
    dispatch(manageDisableScrolling(componentId, disable)),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps)
)(LandingPageComponent);
