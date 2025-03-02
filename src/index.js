/**
 * Main entrypoint file for the application.
 *
 * Handles client-side rendering and server-side rendering (SSR).
 */

// React dependencies
import 'core-js/features/map';
import 'core-js/features/set';
import 'raf/polyfill';

// Dependency libs
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { loadableReady } from '@loadable/component';

// Import default styles
import './styles/marketplaceDefaults.css';

// Configs and store setup
import appSettings from './config/settings';
import defaultConfig from './config/configDefault';
import { LoggingAnalyticsHandler, GoogleAnalyticsHandler } from './analytics/handlers';
import configureStore from './store';

// Utils
import { createInstance, types as sdkTypes } from './util/sdkLoader';
import { mergeConfig } from './util/configHelpers';
import { matchPathname } from './util/routes';
import * as apiUtils from './util/api';
import * as log from './util/log';

// Import Redux actions
import { authInfo } from './ducks/auth.duck';
import { fetchAppAssets } from './ducks/hostedAssets.duck';
import { fetchCurrentUser } from './ducks/user.duck';

// Route config
import routeConfiguration from './routing/routeConfiguration';
// Main app
import { ClientApp, renderApp } from './app';

const render = (store, shouldHydrate) => {
  const state = store.getState();
  const cdnAssetsVersion = state.hostedAssets.version;
  const authInfoLoaded = state.auth.authInfoLoaded;

  const info = authInfoLoaded ? Promise.resolve({}) : store.dispatch(authInfo());
  info
    .then(() => {
      store.dispatch(fetchCurrentUser());

      return Promise.all([
        loadableReady(),
        store.dispatch(fetchAppAssets(defaultConfig.appCdnAssets, cdnAssetsVersion)),
      ]);
    })
    .then(([_, fetchedAppAssets]) => {
      const { translations: translationsRaw, ...rest } = fetchedAppAssets || {};
      const translations = translationsRaw?.data || {};

      const hostedConfig = Object.entries(rest).reduce((collectedData, [name, content]) => {
        return { ...collectedData, [name]: content.data || {} };
      }, {});

      const rootElement = document.getElementById('root');
      const app = <ClientApp store={store} hostedTranslations={translations} hostedConfig={hostedConfig} />;

      if (shouldHydrate) {
        hydrateRoot(rootElement, app);
      } else {
        createRoot(rootElement).render(app);
      }
    })
    .catch(e => {
      log.error(e, 'browser-side-render-failed');
    });
};

// Setup Analytics Handlers
const setupAnalyticsHandlers = googleAnalyticsId => {
  let handlers = [];

  if (appSettings.dev) {
    handlers.push(new LoggingAnalyticsHandler());
  }

  if (googleAnalyticsId) {
    if (!googleAnalyticsId.startsWith('G-')) {
      console.warn('GA4 should have a measurement ID starting with "G-".');
    } else {
      handlers.push(new GoogleAnalyticsHandler());
    }
  }

  return handlers;
};

// If running in a browser, initialize the app
if (typeof window !== 'undefined') {
  log.setup();

  const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
  const assetCdnBaseUrl = appSettings.sdk.assetCdnBaseUrl ? { assetCdnBaseUrl: appSettings.sdk.assetCdnBaseUrl } : {};

  const preloadedState = window.__PRELOADED_STATE__ || '{}';
  const initialState = JSON.parse(preloadedState, sdkTypes.reviver);
  const sdk = createInstance({
    transitVerbose: appSettings.sdk.transitVerbose,
    clientId: appSettings.sdk.clientId,
    secure: appSettings.usingSSL,
    typeHandlers: apiUtils.typeHandlers,
    ...baseUrl,
    ...assetCdnBaseUrl,
  });

  const googleAnalyticsId = initialState?.hostedAssets?.googleAnalyticsId || process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
  const analyticsHandlers = setupAnalyticsHandlers(googleAnalyticsId);
  const store = configureStore(initialState, sdk, analyticsHandlers);

  require('./util/polyfills');
  render(store, !!window.__PRELOADED_STATE__);

  if (appSettings.dev) {
    window.app = { appSettings, defaultConfig, sdk, sdkTypes, store };
  }
}

// Show CSP warnings
const CSP = process.env.REACT_APP_CSP;
const cspEnabled = CSP === 'block' || CSP === 'report';

if (CSP === 'report' && process.env.REACT_APP_ENV === 'production') {
  console.warn('Production should use CSP in "block" mode.');
} else if (!cspEnabled) {
  console.warn("CSP is not enabled! Set REACT_APP_CSP='report' or 'block'.");
}

// Export functions for server-side rendering
export default renderApp;
export {
  matchPathname,
  configureStore,
  routeConfiguration,
  defaultConfig,
  mergeConfig,
  fetchAppAssets,
};
