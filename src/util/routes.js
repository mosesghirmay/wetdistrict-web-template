import {
  pathByRouteName,
  matchPathname,
  createResourceLocatorString,
  findRouteByRouteName,
  canonicalRoutePath,
  replaceParamsInHref,
  generateLinkProps
} from './routeHelpers';

/**
 * Call loadData on the route component if that is available.
 * Ensures that a Promise is always returned, handling potential undefined returns
 */
export const callLoadData = props => {
  const { route, store, config } = props;

  // Early return if there's no route or loadData function
  if (!route || typeof route.loadData !== 'function') {
    return Promise.resolve(null);
  }

  try {
    // Safely execute loadData and handle any result type
    let loadDataResult;
    
    try {
      loadDataResult = route.loadData(store, config);
    } catch (innerError) {
      console.error('Error executing route.loadData:', innerError);
      return Promise.resolve(null);
    }
    
    // Handle null/undefined result
    if (loadDataResult == null) {
      return Promise.resolve(null);
    }
    
    // Check explicitly if the result is a Promise
    const isPromise = 
      loadDataResult instanceof Promise || 
      (loadDataResult && typeof loadDataResult.then === 'function');
      
    if (isPromise) {
      // Return the Promise with error handling
      return Promise.resolve(loadDataResult)
        .then(result => (result !== undefined ? result : null))
        .catch(error => {
          console.error('Error in loadData Promise:', error);
          return null;
        });
    }
    
    // For non-Promise values, just wrap them
    return Promise.resolve(loadDataResult);
  } catch (error) {
    // Final safety net for any other errors
    console.error('Unexpected error in callLoadData:', error);
    return Promise.resolve(null);
  }
};

// Re-export all route helper functions
export {
  pathByRouteName,
  matchPathname,
  createResourceLocatorString,
  findRouteByRouteName,
  canonicalRoutePath,
  replaceParamsInHref,
  generateLinkProps
};

// Default export for compatibility
export default {
  callLoadData,
  pathByRouteName,
  matchPathname,
  createResourceLocatorString,
  findRouteByRouteName,
  canonicalRoutePath,
  replaceParamsInHref,
  generateLinkProps
};