import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import YachtClubVideoHero from './YachtClubVideoHero';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// Synthetic section type that renders the video inside the PageBuilder layout
const YACHT_VIDEO_SECTION = { sectionType: 'yacht-club-video', sectionId: 'promo-video' };

export const CMSPageComponent = props => {
  const { params, pageAssetsData, inProgress, error } = props;
  const pageId = params.pageId || props.pageId;

  if (!inProgress && error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const isYachtClub = pageId === 'yachtclub';
  const rawData = pageAssetsData?.[pageId]?.data;

  // For the yacht club page, prepend the video as the first section so it
  // renders inside the existing layout (below the topbar).
  const pageData = isYachtClub
    ? { ...rawData, sections: [YACHT_VIDEO_SECTION, ...(rawData?.sections || [])] }
    : rawData;

  const options = isYachtClub
    ? { sectionComponents: { 'yacht-club-video': { component: YachtClubVideoHero } } }
    : undefined;

  return (
    <PageBuilder
      pageAssetsData={pageData}
      inProgress={inProgress}
      schemaType="Article"
      options={options}
    />
  );
};

CMSPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const CMSPage = compose(
  withRouter,
  connect(mapStateToProps)
)(CMSPageComponent);

export default CMSPage;
