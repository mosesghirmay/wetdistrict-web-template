const crypto = require('crypto');
const jose = require('jose');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const rootUrl = process.env.REACT_APP_MARKETPLACE_ROOT_URL;
const useDevApiServer = process.env.NODE_ENV === 'development' && !!PORT;

const issuerUrl = useDevApiServer ? `http://localhost:${PORT}` : `${rootUrl}`;

/**
 * Gets user information and creates the signed jwt for id token.
 *
 * @param {string} idpClientId the client id of the idp provider in Console
 * @param {Object} options signing options containing signingAlg and required key information
 * @param {Object} user user information containing at least firstName, lastName, email and emailVerified
 *
 * @return {Promise} idToken
 */
exports.createIdToken = (idpClientId, user, options) => {
  if (!idpClientId) {
    console.error('Missing idp client id!');
    return;
  }
  if (!user) {
    console.error('Missing user information!');
    return;
  }

  const signingAlg = options.signingAlg;

  // Currently Sharetribe Auth API supports only RS256 signing algorithm.
  if (signingAlg !== 'RS256') {
    console.error(`${signingAlg} is not currently supported!`);
    return;
  }

  const { rsaPrivateKey, keyId } = options;

  if (!rsaPrivateKey) {
    console.error('Missing RSA private key!');
    return;
  }

  // We use jose library which requires the RSA key
  // to be KeyLike format:
  // https://github.com/panva/jose/blob/master/docs/types/_types_d_.keylike.md
  const privateKey = crypto.createPrivateKey(rsaPrivateKey);

  const { userId, firstName, lastName, email, emailVerified } = user;

  const jwt = new jose.SignJWT({
    given_name: firstName,
    family_name: lastName,
    email: email,
    email_verified: emailVerified,
  })
    .setProtectedHeader({ alg: signingAlg, kid: keyId })
    .setIssuedAt()
    .setIssuer(issuerUrl)
    .setSubject(userId)
    .setAudience(idpClientId)
    .setExpirationTime('1h')
    .sign(privateKey);

  return jwt;
};

// Serves the discovery document in json format
// this document is expected to be found from
// api/.well-known/openid-configuration endpoint
exports.openIdConfiguration = (req, res) => {
  if (!res.headersSent) {
    res.json({
      issuer: issuerUrl,
      jwks_uri: `${issuerUrl}/.well-known/jwks.json`,
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
    });
  } else {
    console.warn('Headers already sent — skipping response.');
  }
};

/**
 * @param {String} signingAlg signing algorithm, currently only RS256 is supported
 * @param {Array} list containing keys to be served in json endpoint
 *
 * // Serves the RSA public key as JWK
// this document is expected to be found from
// api/.well-known/jwks.json endpoint as stated in discovery document
 */
exports.jwksUri = keys => (req, res) => {
  const jwkKeys = keys.map(key => {
    return jose.exportJWK(crypto.createPublicKey(key.rsaPublicKey)).then(res => {
      return { alg: key.alg, kid: key.keyId, ...res };
    });
  });

  Promise.all(jwkKeys)
    .then(resolvedJwkKeys => {
      if (!res.headersSent) {
        res.json({ keys: resolvedJwkKeys });
      } else {
        console.warn('Headers already sent — skipping response.');
      }
    })
    .catch(error => {
      console.error('jwksUri error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        console.warn('Headers already sent — skipping error response.');
      }
    });
};
