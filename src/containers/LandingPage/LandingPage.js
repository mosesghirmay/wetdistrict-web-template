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
  
  // Define the custom image paths for the yacht imagery
  const facebookImagePath = '/images/facebook-preview.jpg';
  const twitterImagePath = '/images/twitter-preview.jpg';
  
  const {
    listings = [],
    searchParams = {},
  } = props;

  // Only create landingPageData if we have all required data
  // This will prevent the "Cannot read properties of undefined" error
  const landingPageData = config && routeConfiguration ? {
    title: 'WETDISTRICT - Yacht Rentals',
    description: 'Renting a yacht has never been easier.',
    socialSharing: {
      title: 'WETDISTRICT - Yacht Rentals',
      description: 'Renting a yacht has never been easier.',
      images1200: [
        {
          name: 'facebook',
          url: facebookImagePath,
          width: 1200,
          height: 630,
        }
      ],
      images600: [
        {
          name: 'twitter',
          url: twitterImagePath,
          width: 600,
          height: 314,
        }
      ]
    },
    // You can add additional schema metadata for SEO if needed
    schema: {
      '@context': 'http://schema.org',
      '@type': 'Organization',
      name: 'WETDISTRICT',
      description: 'Renting a yacht has never been easier.',
      image: facebookImagePath,
      url: config.marketplaceRootURL || '',
      sameAs: [
        // Add your social media URLs here if available
        // 'https://www.facebook.com/wetdistrict',
        // 'https://www.instagram.com/wetdistrict',
      ],
    }
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