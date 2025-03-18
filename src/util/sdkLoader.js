import * as importedSdk from 'sharetribe-flex-sdk';

let exportSdk;

const isServer = () => typeof window === 'undefined';

if (isServer()) {
  // Use eval to skip webpack from bundling SDK in Node
  // eslint-disable-next-line no-eval
  exportSdk = eval('require')('sharetribe-flex-sdk');
} else {
  exportSdk = importedSdk;
}

const { createInstance, types, transit, util } = exportSdk;

// Debugging function to help diagnose auth issues
const logTokenStatus = (sdk) => {
  if (!isServer() && sdk && typeof sdk.tokenStore?.getToken === 'function') {
    const token = sdk.tokenStore.getToken();
    if (token) {
      console.log('Token exists in SDK token store');
      
      // Check if token is expired
      try {
        const tokenData = token.access_token ? JSON.parse(atob(token.access_token.split('.')[1])) : null;
        if (tokenData && tokenData.exp) {
          const expiryTime = new Date(tokenData.exp * 1000);
          const currentTime = new Date();
          console.log(`Token expires at: ${expiryTime.toISOString()}`);
          console.log(`Current time: ${currentTime.toISOString()}`);
          console.log(`Token is ${expiryTime > currentTime ? 'valid' : 'EXPIRED'}`);
        }
      } catch (e) {
        console.log('Could not parse token expiry information', e);
      }
    } else {
      console.log('No token found in SDK token store - user likely not authenticated');
    }
  }
};

// Custom createInstance wrapper that adds auth debugging
const createInstanceWithDebug = (config) => {
  const sdkInstance = createInstance(config);
  
  // Add a debug method to the SDK
  sdkInstance.debugAuth = () => logTokenStatus(sdkInstance);
  
  // Override the currentUser.show method to add debugging
  const originalShow = sdkInstance.currentUser.show;
  sdkInstance.currentUser.show = (...args) => {
    console.log('Calling currentUser.show with args:', args);
    
    // Log token status before making the request
    logTokenStatus(sdkInstance);
    
    return originalShow.apply(sdkInstance.currentUser, args)
      .catch(error => {
        console.error('currentUser.show failed:', error);
        
        // Check for 401 errors specifically
        if (error.status === 401) {
          console.error('Authentication error (401): Token may be invalid or expired');
          // Force a token refresh if needed
          if (sdkInstance.tokenStore && typeof sdkInstance.tokenStore.refresh === 'function') {
            console.log('Attempting to refresh token...');
            return sdkInstance.tokenStore.refresh()
              .then(() => {
                console.log('Token refreshed, retrying request...');
                return originalShow.apply(sdkInstance.currentUser, args);
              })
              .catch(refreshError => {
                console.error('Token refresh failed:', refreshError);
                throw error; // Throw the original error
              });
          }
        }
        
        throw error;
      });
  };
  
  return sdkInstance;
};

// create image variant from variant name, desired width and aspectRatio
const createImageVariantConfig = (name, width, aspectRatio) => {
  let variantWidth = width;
  let variantHeight = Math.round(aspectRatio * width);

  if (variantWidth > 3072 || variantHeight > 3072) {
    if (!isServer) {
      console.error(`Dimensions of custom image variant (${name}) are too high (w:${variantWidth}, h:${variantHeight}).
      Reduce them to max 3072px. https://www.sharetribe.com/api-reference/marketplace.html#custom-image-variants`);
    }

    if (variantHeight > 3072) {
      variantHeight = 3072;
      variantWidth = Math.round(variantHeight / aspectRatio);
    } else if (variantHeight > 3072) {
      variantWidth = 3072;
      variantHeight = Math.round(aspectRatio * variantWidth);
    }
  }

  // Create the raw query string
  const rawQueryString = util.objectQueryString({
    w: variantWidth,
    h: variantHeight,
    fit: 'crop',
  });
  
  // Log the raw query string for debugging
  if (!isServer) {
    console.log(`DEBUG - Image variant "${name}" query string:`, rawQueryString);
  }
  
  // Check for potentially problematic characters in the query string
  if (rawQueryString.includes('%3B')) {
    console.warn(`Warning: Image variant "${name}" contains semicolons that might cause API issues`);
  }
  
  // Return the standard format
  return {
    [`imageVariant.${name}`]: rawQueryString,
  };
};

export { createInstanceWithDebug as createInstance, types, transit, util, createImageVariantConfig };
