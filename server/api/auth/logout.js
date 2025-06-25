/**
 * Logout endpoint that clears user tokens
 */
const sharetribeSdk = require('sharetribe-flex-sdk');

module.exports = (req, res) => {
  // Create a tokenStore that will clear the cookies
  const tokenStore = sharetribeSdk.tokenStore.expressCookieStore({
    clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
    req,
    res,
    secure: process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true',
  });
  
  // Clear the token
  tokenStore.clearToken();
  
  // Also clear any session data
  if (req.session) {
    req.session.destroy();
  }
  
  // Return success
  res.status(200).json({ success: true });
};