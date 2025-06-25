/**
 * Utility to patch Sharetribe SDK instances with missing functionality
 */
export const patchSdk = (sdk) => {
  if (!sdk) return sdk;
  
  // Fix missing tokenStore methods
  if (sdk.tokenStore) {
    if (!sdk.tokenStore.setToken) {
      console.log('Patching missing setToken method');
      sdk.tokenStore.setToken = function(token) {
        console.log('Using patched setToken');
        try {
          window.sessionStorage.setItem('sharetribe-token', JSON.stringify(token));
        } catch (e) {
          console.error('Error in patched setToken', e);
        }
        return token;
      };
    }
    
    if (!sdk.tokenStore.getToken) {
      console.log('Patching missing getToken method');
      sdk.tokenStore.getToken = function() {
        try {
          const tokenStr = window.sessionStorage.getItem('sharetribe-token');
          return tokenStr ? JSON.parse(tokenStr) : null;
        } catch (e) {
          console.error('Error in patched getToken', e);
          return null;
        }
      };
    }
    
    if (!sdk.tokenStore.removeToken) {
      console.log('Patching missing removeToken method');
      sdk.tokenStore.removeToken = function() {
        try {
          window.sessionStorage.removeItem('sharetribe-token');
        } catch (e) {
          console.error('Error in patched removeToken', e);
        }
        return null;
      };
    }
  }
  
  return sdk;
};