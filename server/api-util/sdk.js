const http = require('http');
const https = require('https');
const Decimal = require('decimal.js');
const log = require('../log');
const sharetribeSdk = require('sharetribe-flex-sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const MAX_SOCKETS = process.env.MAX_SOCKETS;
const MAX_SOCKETS_DEFAULT = 10;

const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
const ASSET_CDN_BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;

// Type handlers
const typeHandlers = [
  {
    type: sharetribeSdk.types.BigDecimal,
    customType: Decimal,
    writer: v => new sharetribeSdk.types.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];
exports.typeHandlers = typeHandlers;

const baseUrlMaybe = BASE_URL ? { baseUrl: BASE_URL } : {};
const assetCdnBaseUrlMaybe = ASSET_CDN_BASE_URL ? { assetCdnBaseUrl: ASSET_CDN_BASE_URL } : {};
const maxSockets = MAX_SOCKETS ? parseInt(MAX_SOCKETS, 10) : MAX_SOCKETS_DEFAULT;

// Reuse TCP connections
const httpAgent = new http.Agent({ keepAlive: true, maxSockets });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets });

const memoryStore = token => {
  const store = sharetribeSdk.tokenStore.memoryStore();
  store.setToken(token);
  return store;
};

const getUserToken = req => {
  const cookieTokenStore = sharetribeSdk.tokenStore.expressCookieStore({
    clientId: CLIENT_ID,
    req,
    secure: USING_SSL,
  });
  return cookieTokenStore.getToken();
};

exports.serialize = data => {
  return sharetribeSdk.transit.write(data, { typeHandlers, verbose: TRANSIT_VERBOSE });
};

exports.deserialize = str => {
  return sharetribeSdk.transit.read(str, { typeHandlers });
};

exports.handleError = (res, error) => {
  log.error(error, 'local-api-request-failed', error?.data);

  if (res.headersSent) {
    console.warn('Headers already sent, skipping error response');
    return;
  }

  if (error.status && error.statusText && error.data) {
    return res.status(error.status).json({
      name: 'LocalAPIError',
      message: 'Local API request failed',
      status: error.status,
      statusText: error.statusText,
      data: error.data,
    });
  }

  return res.status(500).json({ error: error.message || 'Internal Server Error' });
};

exports.getSdk = (req, res) => {
  return sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    httpAgent,
    httpsAgent,
    tokenStore: sharetribeSdk.tokenStore.expressCookieStore({
      clientId: CLIENT_ID,
      req,
      res,
      secure: USING_SSL,
    }),
    typeHandlers,
    ...baseUrlMaybe,
    ...assetCdnBaseUrlMaybe,
  });
};

exports.getTrustedSdk = req => {
  const userToken = getUserToken(req);

  const sdk = sharetribeSdk.createInstance({
    transitVerbose: TRANSIT_VERBOSE,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    httpAgent,
    httpsAgent,
    tokenStore: memoryStore(userToken),
    typeHandlers,
    ...baseUrlMaybe,
  });

  return sdk.exchangeToken().then(response => {
    const trustedToken = response.data;

    return sharetribeSdk.createInstance({
      transitVerbose: TRANSIT_VERBOSE,
      clientId: CLIENT_ID,
      tokenStore: memoryStore(trustedToken),
      httpAgent,
      httpsAgent,
      typeHandlers,
      ...baseUrlMaybe,
    });
  });
};

exports.fetchCommission = sdk => {
  return sdk
    .assetsByAlias({ paths: ['transactions/commission.json'], alias: 'latest' })
    .then(response => {
      const commissionAsset = response?.data?.data?.[0];
      if (!commissionAsset) {
        const message = 'Insufficient pricing configuration set.';
        const error = new Error(message);
        error.status = 400;
        error.statusText = message;
        error.data = {};
        throw error;
      }
      return response;
    });
};

exports.fetchBranding = sdk => {
  return sdk
    .assetsByAlias({ paths: ['design/branding.json'], alias: 'latest' })
    .then(response => {
      const brandingAsset = response?.data?.data?.[0];
      if (!brandingAsset) {
        const message = 'Branding configuration was not available.';
        const error = new Error(message);
        error.status = 400;
        error.statusText = message;
        error.data = {};
        throw error;
      }
      return response;
    });
};

exports.fetchAccessControlAsset = sdk => {
  return sdk
    .assetsByAlias({ paths: ['/general/access-control.json'], alias: 'latest' })
    .then(response => {
      const accessControlAsset = response?.data?.data?.[0];
      if (!accessControlAsset) {
        const message = 'Access-control configuration was not available.';
        const error = new Error(message);
        error.status = 404;
        error.statusText = message;
        error.data = {};
        throw error;
      }
      return response;
    });
};
