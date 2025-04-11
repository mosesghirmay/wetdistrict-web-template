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

// Enhanced error handler for SDK calls
const enhancedErrorHandler = (error, methodName, sdkInstance, args) => {
  console.error(`SDK Error in ${methodName}:`, error);
  
  if (error.status === 401) {
    console.error('Authentication error (401): Token may be invalid or expired');
    // Force a token refresh if needed
    if (sdkInstance.tokenStore && typeof sdkInstance.tokenStore.refresh === 'function') {
      console.log('Attempting to refresh token...');
      return sdkInstance.tokenStore.refresh()
        .then(() => {
          console.log('Token refreshed, retrying request...');
          // Return the original method call with fresh token
          return sdkInstance[methodName].apply(sdkInstance, args);
        })
        .catch(refreshError => {
          console.error('Token refresh failed:', refreshError);
          throw error; // Throw the original error
        });
    }
  } else if (error.status === 403) {
    console.error('Authorization error (403): Insufficient permissions');
  } else if (error.status === 429) {
    console.error('Rate limit error (429): Too many requests');
  } else if (error.status >= 500) {
    console.error('Server error:', error.status);
  }
  
  throw error;
};

// Custom createInstance wrapper that adds auth debugging and enhanced error handling
const createInstanceWithDebug = (config) => {
  // Ensure we have the proper production URL for the Sharetribe API
  const enhancedConfig = {
    ...config,
    baseUrl: config.baseUrl || 'https://flex-api.sharetribe.com',
  };
  
  console.log('Creating SDK instance with config:', {
    ...enhancedConfig,
    // Don't log token store or sensitive data
    clientId: enhancedConfig.clientId ? '[SET]' : '[NOT SET]',
    clientSecret: enhancedConfig.clientSecret ? '[SET]' : '[NOT SET]',
    tokenStore: enhancedConfig.tokenStore ? '[TOKEN STORE OBJECT]' : '[NOT SET]',
    typeHandlers: enhancedConfig.typeHandlers ? '[TYPE HANDLERS OBJECT]' : '[NOT SET]',
  });
  
  // Create the SDK instance with enhanced config
  const sdkInstance = createInstance(enhancedConfig);
  
  // Add a debug method to the SDK
  sdkInstance.debugAuth = () => logTokenStatus(sdkInstance);
  
  // Wrap key SDK methods with error handling

  // Override the currentUser.show method
  const originalShow = sdkInstance.currentUser.show;
  sdkInstance.currentUser.show = (...args) => {
    console.log('Calling currentUser.show with args:', args);
    logTokenStatus(sdkInstance);
    
    return originalShow.apply(sdkInstance.currentUser, args)
      .catch(error => enhancedErrorHandler(error, 'currentUser.show', sdkInstance.currentUser, args));
  };

  // Add error handling to listings.query
  const originalListingsQuery = sdkInstance.listings.query;
  sdkInstance.listings.query = (...args) => {
    console.log('Calling listings.query with params', args[0] ? JSON.stringify(args[0]) : 'no params');
    
    return originalListingsQuery.apply(sdkInstance.listings, args)
      .catch(error => enhancedErrorHandler(error, 'listings.query', sdkInstance.listings, args));
  };
  
  return sdkInstance;
};

// Create image variant from variant name, desired width and aspectRatio
const createImageVariantConfig = (name, width, aspectRatio) => {
  let variantWidth = width;
  let variantHeight = Math.round(aspectRatio * width);

  // Ensure dimensions are within API limits
  if (variantWidth > 3072 || variantHeight > 3072) {
    if (!isServer()) {
      console.error(`Dimensions of custom image variant (${name}) are too high (w:${variantWidth}, h:${variantHeight}).
      Reduce them to max 3072px. https://www.sharetribe.com/api-reference/marketplace.html#custom-image-variants`);
    }

    if (variantHeight > 3072) {
      variantHeight = 3072;
      variantWidth = Math.round(variantHeight / aspectRatio);
    } else if (variantWidth > 3072) {
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
  
  // Check for potentially problematic characters in the query string
  if (rawQueryString.includes('%3B')) {
    console.warn(`Warning: Image variant "${name}" contains semicolons that might cause API issues`);
  }
  
  // Return the standard format
  return {
    [`imageVariant.${name}`]: rawQueryString,
  };
};

// Add global promise rejection handler
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED PROMISE REJECTION IN SDK:', reason);
  });
}

export { createInstanceWithDebug as createInstance, types, transit, util, createImageVariantConfig };