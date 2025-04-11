/**
 * Custom error handler for the application
 * Prevents duplicate error handlers in the build process
 */

// Custom error handler that can be used to prevent duplicates
export const defaultErrorHandler = error => {
  console.error('Error encountered:', error);
};

// Export a wrapper for the IntlProvider to ensure consistent error handling
export const getErrorHandlerConfig = () => {
  return {
    onError: defaultErrorHandler
  };
};