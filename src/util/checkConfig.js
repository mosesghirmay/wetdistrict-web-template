/**
 * Utility to check port configurations and debug API connectivity issues
 */

export const checkPortConfiguration = () => {
  const currentPort = window.location.port || '3000';
  const configuredPort = process.env.REACT_APP_DEV_API_SERVER_PORT || '3000';
  
  if (currentPort !== configuredPort) {
    console.error(`Port mismatch: Running on ${currentPort}, configured for ${configuredPort}`);
    console.error('This may cause API connection issues. Update REACT_APP_DEV_API_SERVER_PORT to match.');
  } else {
    console.log(`✅ Port configuration correct: ${currentPort}`);
  }
  
  console.log('API Base URL:', process.env.REACT_APP_MARKETPLACE_ROOT_URL);
  console.log('Current Origin:', window.location.origin);
};

export default checkPortConfiguration;