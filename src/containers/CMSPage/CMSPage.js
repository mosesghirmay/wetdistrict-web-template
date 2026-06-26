import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

export const CMSPageComponent = props => {
  const { params, pageAssetsData, inProgress, error } = props;
  const pageId = params.pageId || props.pageId;
  const isYachtClub = pageId === 'yachtclub';

  // For all pages except yachtclub, show the standard 404 when the hosted
  // assets API can't find the page. yachtclub is exempt so it always renders
  // even if no Console CMS page is configured (the content lives in Console
  // but we don't want a 404 race condition to blank the page).
  if (!inProgress && error?.status === 404 && !isYachtClub) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const rawData = pageAssetsData?.[pageId]?.data;

  // For yachtclub, if there's no hosted page data yet, provide an empty
  // sections array so PageBuilder renders the shell without erroring.
  const pageData = isYachtClub ? { ...rawData, sections: rawData?.sections || [] } : rawData;

  return (
    <PageBuilder
      pageAssetsData={pageData}
      inProgress={inProgress}
      schemaType="Article"
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
