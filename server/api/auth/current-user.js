/**
 * An endpoint for fetching current user data directly from server-side.
 * This is primarily used for handling authentication from server-side
 * without relying on client-side authentication flow.
 */

const { getSdk, handleError, serialize } = require('../../api-util/sdk');

module.exports = (req, res) => {
  // Use cookie-based auth directly through the SDK
  const sdk = getSdk(req, res);

  sdk.currentUser
    .show({
      include: ['profileImage', 'stripeAccount'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
      'imageVariant.square-small': 'w:240;h:240;fit:crop',
      'imageVariant.square-small2x': 'w:480;h:480;fit:crop',
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .send(serialize(data));
    })
    .catch(e => {
      // Only return 401 for auth errors, not other server errors
      if (e.status === 401) {
        return res.status(401).send({
          error: 'Unauthorized',
          message: 'User authentication is required to access this endpoint',
          status: 401,
        });
      }
      handleError(res, e);
    });
};