# Sharetribe Development Guide

## Common Issues and Solutions

### Development Server Configuration
The app runs as a single unified server in development mode on port 3000. The important settings:
1. `package.json`: dev script runs `sharetribe-scripts start` (no separate backend server)
2. API routing is handled by the `setupProxy.js` file for development
3. All API calls go to the same server that serves the frontend

If you experience API connection issues (404 errors):
```bash
# Use the restart.sh script which properly sets up setupProxy.js
./restart.sh

# For detailed debugging of API calls
DEBUG=* ./restart.sh
```

The `setupProxy.js` file is automatically created by the restart scripts to ensure proper API routing in development mode.

### Token Store Issues
The app uses a custom token store implementation in `src/util/sdkLoader.js` to fix compatibility issues with newer SDK versions. 

This patch addresses the "r.setToken is not a function" error by providing our own implementation of the token store methods.

### Authentication in Development
Development mode bypasses authentication with the environment variable:
```
REACT_APP_BYPASS_AUTH=true
```

When this is enabled (which is done automatically by `restart.sh`):
1. The app will simulate an authenticated state
2. A fake user profile will be created with the email address you enter
3. API calls will still happen, but auth-related errors won't block the UI
4. The login flow will use a mock process instead of actual authentication

### Booking Date Validation & Fixed Duration Booking Fix
The app validates booking dates in multiple places to prevent errors with invalid dates:

1. In `src/containers/CheckoutPage/CheckoutPage.duck.js`:
   - Checks that dates are not null or undefined
   - Verifies dates are not Unix epoch (0)
   - Logs detailed errors if validation fails

2. In `src/components/OrderPanel/BookingDatesForm/BookingDatesForm.js`:
   - Performs strict date validation before fetching line items
   - Adds detailed logging to trace date validation issues
   - Prevents API calls with invalid dates

3. **Fixed Time Booking Date Fix:**
   - In `src/components/OrderPanel/BookingFixedDurationForm/BookingFixedDurationForm.js`:
     - Fixed issue where only the time was being used, resulting in 1970 dates
     - Now properly combines the selected date with the time values
     - Creates valid date objects by merging date parts and time parts
     - Adds extensive logging to track date creation

4. In date format conversions:
   - Ensures consistent date object creation and validation
   - Prevents Jan 1, 1970 epoch dates from being used
   - Logs when invalid dates are detected

If you encounter booking date issues, check the browser console for messages like:
- "❌ Invalid dates detected"
- "⛔ Skipping speculate call — invalid dates"
- "📅 Creating dates from: ..." - shows the date creation process

### Login Loop Fix
The login loop issue is fixed by:
1. Providing a complete fake user profile when using bypass auth
2. Improving error handling in the ProfileSettingsPage component
3. Making `ensureCurrentUser` helper more robust against incomplete user data

### Web Manifest
The site manifest is located at `/public/site.webmanifest` and served from the app. The manifest is also available at `/static/site.webmanifest` for compatibility. To update app icons or other PWA settings, modify these files.

## Debug & Troubleshooting

### Common Errors

#### Authentication Errors
- `r.setToken is not a function`: Fixed by our custom token store implementation
- `missing or null payload in AUTH_INFO_SUCCESS action`: Fixed by ensuring we always pass a valid payload 
- `load-data-failed`: This is handled gracefully now, but indicates API call failures
- `Login loop redirect`: Fixed by providing robust profile data when in development mode

#### Debug Messages
Look for these debug messages in the console:
- 🔑 Development mode: Using fake login success 
- 🧑 Using fake user data for development

## Common Commands

### Start Development Server with Auth Bypass
```bash
./restart.sh
```

### Build for Production
```bash
yarn build
```

### Run Tests
```bash
yarn test
```

### Clear Browser Storage
To completely reset all data:
```js
// Run in browser console
localStorage.clear();
sessionStorage.clear();
```
