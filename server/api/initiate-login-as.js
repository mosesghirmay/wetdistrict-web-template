const crypto = require('crypto');

const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const ROOT_URL = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const CONSOLE_URL = process.env.SERVER_SHARETRIBE_CONSOLE_URL || 'https://console.sharetribe.com';
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';

// Add this line for debugging
console.log('Environment variables in initiate-login-as.js:', {
  CLIENT_ID,
  ROOT_URL,
  CONSOLE_URL,
  USING_SSL,
});

// Add a fallback for ROOT_URL to prevent errors
const ROOT_URL_SAFE = ROOT_URL || process.env.ROOT_URL || 'http://localhost:3000';

// redirect_uri param used when initiating a login as authentication flow and
// when requesting a token using an authorization code
const loginAsRedirectUri = `${ROOT_URL_SAFE.replace(/\/$/, '')}/api/login-as`;

// Cookies used for authorization code authentication.
const stateKey = `st-${CLIENT_ID}-oauth2State`;
const codeVerifierKey = `st-${CLIENT_ID}-pkceCodeVerifier`;

// Cookies used for additional login information
const targetPathKey = `st-${CLIENT_ID}-targetPath`;

/**
 * Makes a base64 string URL friendly by
 * replacing unaccepted characters.
 */
const urlifyBase64 = base64Str =>
  base64Str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

// Initiates an authorization code authentication flow. This authentication flow
// enables marketplace operators that have an ongoing Console session to log
// into their marketplace as a user of the marketplace.
//
// The authorization code is requested from Console and it is used to request a
// token from the Sharetribe Auth API.
//
// This endpoint will return a 302 to Console which requests the authorization
// code. Console returns a 302 with the code to the `redirect_uri` that is
// passed in this response. The request to the redirect URI is handled with the
// `/login-as` endpoint.
module.exports = (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      if (!res.headersSent) {
        return res.status(400).send('Missing query parameter: user_id.');
      }
      return;
    }
    if (!ROOT_URL_SAFE) {
      if (!res.headersSent) {
        return res.status(409).send('Marketplace canonical root URL is missing.');
      }
      return;
    }

    const state = urlifyBase64(crypto.randomBytes(32).toString('base64'));
    const codeVerifier = urlifyBase64(crypto.randomBytes(32).toString('base64'));
    const hash = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64');
    const codeChallenge = urlifyBase64(hash);
    const authorizeServerUrl = `${CONSOLE_URL}/api/authorize-as`;
    const { target_path: targetPath } = req.query || {};

    const location = `${authorizeServerUrl}?\
response_type=code&\
client_id=${CLIENT_ID}&\
redirect_uri=${loginAsRedirectUri}&\
user_id=${userId}&\
state=${state}&\
code_challenge=${codeChallenge}&\
code_challenge_method=S256`;

    const cookieOpts = {
      maxAge: 1000 * 30, // 30 seconds
      secure: USING_SSL,
    };

    if (!res.headersSent) {
      res.cookie(stateKey, state, cookieOpts);
      res.cookie(codeVerifierKey, codeVerifier, cookieOpts);
      if (targetPath) {
        res.cookie(targetPathKey, targetPath, cookieOpts);
      }
      return res.redirect(location);
    }
  } catch (error) {
    console.error('initiate-login-as error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    } else {
      console.warn('Headers already sent — skipping error response.');
    }
  }
};