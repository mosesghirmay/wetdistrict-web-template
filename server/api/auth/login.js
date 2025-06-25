/**
 * Login endpoint that handles authentication with SDK and returns user tokens
 */
const { getSdk, handleError, serialize } = require('../../api-util/sdk');
const sharetribeSdk = require('sharetribe-flex-sdk');

module.exports = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Both username and password are required',
      status: 400,
    });
  }

  // Create a new SDK instance for login
  const sdk = sharetribeSdk.createInstance({
    clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
    secure: process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true',
  });

  // Call Sharetribe login API
  sdk.login({ username, password })
    .then(loginResponse => {
      // Login successful, now we need to create a token for the session
      const tokenStore = sharetribeSdk.tokenStore.expressCookieStore({
        clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
        req,
        res,
        secure: process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true',
      });
      
      // Store the token from login response
      const token = loginResponse.data;
      tokenStore.setToken(token);
      
      // Return success without exposing the token
      res.status(200).json({ success: true });
    })
    .catch(error => {
      console.error('Login error:', error.status, error.statusText);
      
      // Return appropriate error message
      if (error.status === 401) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid username or password',
          status: 401,
        });
      }
      
      return handleError(res, error);
    });
};