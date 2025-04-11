const http = require('http');
const https = require('https');
const sharetribeSdk = require('sharetribe-flex-sdk');
const { handleError, serialize, typeHandlers } = require('../../api-util/sdk');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;

const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const FACEBOOK_IDP_ID = 'facebook';
const GOOGLE_IDP_ID = 'google';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const baseUrl = BASE_URL ? { baseUrl: BASE_URL } : {};

module.exports = async (req, res) => {
  try {
    const tokenStore = sharetribeSdk.tokenStore.expressCookieStore({
      clientId: CLIENT_ID,
      req,
      res,
      secure: USING_SSL,
    });

    const sdk = sharetribeSdk.createInstance({
      transitVerbose: TRANSIT_VERBOSE,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      httpAgent,
      httpsAgent,
      tokenStore,
      typeHandlers,
      ...baseUrl,
    });

    const { idpToken, idpId, ...rest } = req.body;

    const idpClientId =
      idpId === FACEBOOK_IDP_ID
        ? FACEBOOK_APP_ID
        : idpId === GOOGLE_IDP_ID
        ? GOOGLE_CLIENT_ID
        : null;

    if (!idpClientId) {
      const err = new Error(`Unsupported IDP: ${idpId}`);
      err.status = 400;
      throw err;
    }

    // Create user with identity provider
    await sdk.currentUser.createWithIdp({ idpId, idpClientId, idpToken, ...rest });

    // Log in the user with IDP
    const apiResponse = await sdk.loginWithIdp({
      idpId,
      idpClientId,
      idpToken,
    });

    const { status, statusText, data } = apiResponse;

    if (!res.headersSent) {
      return res
        .clearCookie('st-authinfo')
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    } else {
      console.warn('Headers already sent — skipping response.');
    }
  } catch (error) {
    console.error('Error in createUserWithIdp:', error);
    if (!res.headersSent) {
      return handleError(res, error);
    } else {
      console.warn('Headers already sent — skipping handleError.');
    }
  }
};
