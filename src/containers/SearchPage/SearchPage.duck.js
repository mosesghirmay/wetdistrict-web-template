import { debounce } from 'lodash';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { isErrorUserPendingApproval, isForbiddenError, storableError } from '../../util/errors';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import {
  parseDateFromISO8601,
  getExclusiveEndDate,
  addTime,
  subtractTime,
  daysBetween,
  getStartOf,
} from '../../util/dates';
import { constructQueryParamName, isOriginInUse, isStockInUse } from '../../util/search';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { parse } from '../../util/urlHelpers';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { getTimeAvailabilityFilterParams } from '../../util/timeAvailabilitySearch';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 12 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 24;

// Cache for storing search results
const searchCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache lifetime

// ================ Action types ================ //

export const SEARCH_LISTINGS_REQUEST = 'app/SearchPage/SEARCH_LISTINGS_REQUEST';
export const SEARCH_LISTINGS_SUCCESS = 'app/SearchPage/SEARCH_LISTINGS_SUCCESS';
export const SEARCH_LISTINGS_ERROR = 'app/SearchPage/SEARCH_LISTINGS_ERROR';

export const SEARCH_MAP_LISTINGS_REQUEST = 'app/SearchPage/SEARCH_MAP_LISTINGS_REQUEST';
export const SEARCH_MAP_LISTINGS_SUCCESS = 'app/SearchPage/SEARCH_MAP_LISTINGS_SUCCESS';
export const SEARCH_MAP_LISTINGS_ERROR = 'app/SearchPage/SEARCH_MAP_LISTINGS_ERROR';

export const SEARCH_MAP_SET_ACTIVE_LISTING = 'app/SearchPage/SEARCH_MAP_SET_ACTIVE_LISTING';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  searchParams: null,
  searchInProgress: false,
  searchListingsError: null,
  currentPageResultIds: [],
};

const resultIds = data => {
  const listings = data.data;
  return listings
    .filter(l => !l.attributes.deleted && l.attributes.state === 'published')
    .map(l => l.id);
};

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SEARCH_LISTINGS_REQUEST:
      return {
        ...state,
        searchParams: payload.searchParams,
        searchInProgress: true,
        searchMapListingIds: [],
        searchListingsError: null,
      };
    case SEARCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        pagination: payload.data.meta,
        searchInProgress: false,
      };
    case SEARCH_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, searchInProgress: false, searchListingsError: payload };

    case SEARCH_MAP_SET_ACTIVE_LISTING:
      return {
        ...state,
        activeListingId: payload,
      };
    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const searchListingsRequest = searchParams => ({
  type: SEARCH_LISTINGS_REQUEST,
  payload: { searchParams },
});

export const searchListingsSuccess = response => ({
  type: SEARCH_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const searchListingsError = e => ({
  type: SEARCH_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// Implement fetchWithRetry for handling 429 errors with exponential backoff
const fetchWithRetry = async (sdk, params, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await sdk.listings.query(params);
    } catch (error) {
      if (error.status === 429 && retries < maxRetries - 1) {
        // If rate limited, wait with exponential backoff
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
};

// Implement debounced search to avoid excessive API calls
const debouncedSearch = debounce((dispatch, sdk, params, config) => {
  const cacheKey = JSON.stringify(params);
  const now = Date.now();
  const cachedItem = searchCache.get(cacheKey);
  
  // Use cached results if available and not expired
  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    dispatch(addMarketplaceEntities(cachedItem.response, {
      listingFields: config?.listing?.listingFields
    }));
    dispatch(searchListingsSuccess(cachedItem.response));
    return Promise.resolve(cachedItem.response);
  }

  return fetchWithRetry(sdk, params)
    .then(response => {
      // Cache the response
      searchCache.set(cacheKey, {
        response,
        timestamp: now
      });
      
      dispatch(addMarketplaceEntities(response, {
        listingFields: config?.listing?.listingFields
      }));
      dispatch(searchListingsSuccess(response));
      return response;
    })
    .catch(e => {
      const error = storableError(e);
      dispatch(searchListingsError(error));
      if (!(isErrorUserPendingApproval(error) || isForbiddenError(error))) {
        // Return a rejected promise instead of throwing
        return Promise.reject(error);
      }
      // Return a resolved promise for handled errors
      return Promise.resolve();
    });
}, 500); // 500ms debounce

export const searchListings = (searchParams, config) => (dispatch, getState, sdk) => {
  console.log('Search initiated with parameters:', searchParams);
  dispatch(searchListingsRequest(searchParams));

  // SearchPage can enforce listing query to only those listings with valid listingType
  // NOTE: this only works if you have set 'enum' type search schema to listing's public data fields
  //       - listingType
  //       Same setup could be expanded to 2 other extended data fields:
  //       - transactionProcessAlias
  //       - unitType
  //       ...and then turned enforceValidListingType config to true in configListing.js
  // Read More:
  // https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
  const searchValidListingTypes = listingTypes => {
    return config.listing.enforceValidListingType
      ? {
          pub_listingType: listingTypes.map(l => l.listingType),
          // pub_transactionProcessAlias: listingTypes.map(l => l.transactionType.alias),
          // pub_unitType: listingTypes.map(l => l.transactionType.unitType),
        }
      : {};
  };

  const omitInvalidCategoryParams = params => {
    const categoryConfig = config.search.defaultFilters?.find(f => f.schemaType === 'category');
    const categories = config.categoryConfiguration.categories;
    const { key: prefix, scope } = categoryConfig || {};
    const categoryParamPrefix = constructQueryParamName(prefix, scope);

    const validURLParamForCategoryData = (prefix, categories, level, params) => {
      const levelKey = `${categoryParamPrefix}${level}`;
      const levelValue = params?.[levelKey];
      const foundCategory = categories.find(cat => cat.id === levelValue);
      const subcategories = foundCategory?.subcategories || [];
      return foundCategory && subcategories.length > 0
        ? {
            [levelKey]: levelValue,
            ...validURLParamForCategoryData(prefix, subcategories, level + 1, params),
          }
        : foundCategory
        ? { [levelKey]: levelValue }
        : {};
    };

    const categoryKeys = validURLParamForCategoryData(prefix, categories, 1, params);
    const nonCategoryKeys = Object.entries(params).reduce(
      (picked, [k, v]) => (k.startsWith(categoryParamPrefix) ? picked : { ...picked, [k]: v }),
      {}
    );

    return { ...nonCategoryKeys, ...categoryKeys };
  };

  const priceSearchParams = priceParam => {
    const inSubunits = value => convertUnitToSubUnit(value, unitDivisor(config.currency));
    const values = priceParam ? priceParam.split(',') : [];
    return priceParam && values.length === 2
      ? {
          price: [inSubunits(values[0]), inSubunits(values[1]) + 1].join(','),
        }
      : {};
  };

  const datesSearchParams = datesParam => {
    // If no date parameter is provided, return empty object
    if (!datesParam) {
      return {};
    }
    
    console.log('Processing date parameter in SearchPage.duck.js:', datesParam);
    
    const searchTZ = 'Etc/UTC';
    
    // Parse date values from comma-separated string
    const values = datesParam.split(',');
    
    // Validate that we have two values
    if (values.length < 2 || !values[0] || !values[1]) {
      console.log('Invalid date values', values);
      return {};
    }
    
    try {
      // Parse the dates
      const startDate = parseDateFromISO8601(values[0], searchTZ);
      const endDate = parseDateFromISO8601(values[1], searchTZ);
      
      if (!startDate || !endDate) {
        console.log('Could not parse date values', { startDate, endDate });
        return {};
      }
      
      // For day-based filters, we need to convert to valid format
      // Get beginning of day
      const startOfDay = getStartOf(startDate, 'day', searchTZ);
      
      // Get end of day (or next day if that's what was provided)
      // This is what makes filtering work effectively
      const endOfRange = endDate;
      
      console.log('Date range for availability:', {
        start: startOfDay.toISOString(),
        end: endOfRange.toISOString(),
      });
      
      // The key is to create a proper date filter parameter for the API
      // An important fix: use the right timezone padding
      return {
        // Time-partial allows partial availability within the time range
        availability: 'time-full',
        
        // These need to be in ISO format
        start: startOfDay.toISOString(),
        end: endOfRange.toISOString(),
        
        // For day-based bookings, we want to filter for a full day
        minDuration: 1440, // Full day in minutes
        
        // Type hint for API (if needed)
        bookingType: 'day',
        
        // Provide raw values for other uses
        datesQueryParam: datesParam,
      };
    } catch (error) {
      console.error('Error processing date params:', error);
      return {};
    }
  };

  const stockFilters = datesMaybe => {
    const hasDatesFilterInUse = Object.keys(datesMaybe).length > 0;

    // If dates filter is not in use,
    //   1) Add minStock filter with default value (1)
    //   2) Add relaxed stockMode: "match-undefined"
    // The latter is used to filter out all the listings that explicitly are out of stock,
    // but keeps bookable and inquiry listings.
    return hasDatesFilterInUse ? {} : { minStock: 1, stockMode: 'match-undefined' };
  };

  const seatsSearchParams = (seats, datesMaybe) => {
    const seatsFilter = config.search.defaultFilters.find(f => f.key === 'seats');
    const hasDatesFilterInUse = Object.keys(datesMaybe).length > 0;

    // Seats filter cannot be applied without dates
    return hasDatesFilterInUse && seatsFilter ? { seats } : {};
  };

  const { perPage, price, dates, seats, sort, mapSearch, ...restOfParams } = searchParams;
  const priceMaybe = priceSearchParams(price);
  const datesMaybe = datesSearchParams(dates);
  const stockMaybe = stockFilters(datesMaybe);
  const seatsMaybe = seatsSearchParams(seats, datesMaybe);
  const sortMaybe = sort === config.search.sortConfig.relevanceKey ? {} : { sort };
  
  // Handle capacity parameter
  const capacityParam = params => {
    // Check if we have a pub_capacity parameter
    const capacityValue = params.pub_capacity;
    if (!capacityValue) return {};
    
    // If capacity is in format "min,max", use it directly
    // This handles our GuestsFilter format which is "n,n"
    if (capacityValue.includes(',')) {
      console.log('Using capacity filter:', capacityValue);
      return { pub_capacity: capacityValue };
    }
    
    return {};
  };
  
  // Get time availability filter params
  const timeAvailabilityParams = getTimeAvailabilityFilterParams(restOfParams);
  const capacityParams = capacityParam(restOfParams);

  const params = {
    // The rest of the params except invalid nested category-related params
    // Note: invalid independent search params are still passed through
    ...omitInvalidCategoryParams(restOfParams),
    ...priceMaybe,
    ...datesMaybe,
    ...stockMaybe,
    ...seatsMaybe,
    ...sortMaybe,
    ...searchValidListingTypes(config.listing.listingTypes),
    // Add time availability filter params
    ...timeAvailabilityParams,
    // Add capacity filter params
    ...capacityParams,
    perPage,
  };

  // Use the debounced search to prevent excessive API calls
  return debouncedSearch(dispatch, sdk, params, config);
};

export const setActiveListing = listingId => ({
  type: SEARCH_MAP_SET_ACTIVE_LISTING,
  payload: listingId,
});

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  // In private marketplace mode, this page won't fetch data if the user is unauthorized
  const state = getState();
  const currentUser = state.user?.currentUser;
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const hasViewingRights = currentUser && hasPermissionToViewData(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const canFetchData =
    !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized && hasViewingRights);
  if (!canFetchData) {
    return Promise.resolve();
  }

  const queryParams = parse(search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  const { page = 1, address, origin, ...rest } = queryParams;
  const originMaybe = isOriginInUse(config) && origin ? { origin } : {};

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const searchListingsCall = searchListings(
    {
      ...rest,
      ...originMaybe,
      page,
      perPage: RESULT_PAGE_SIZE,
      include: ['author', 'images'],
      'fields.listing': [
        'title',
        'geolocation',
        'price',
        'deleted',
        'state',
        'publicData.listingType',
        'publicData.transactionProcessAlias',
        'publicData.unitType',
        'publicData.model',
        'publicData.capacity',
        // These help rendering of 'purchase' listings,
        // when transitioning from search page to listing page
        'publicData.pickupEnabled',
        'publicData.shippingEnabled',
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': [
        'variants.scaled-small',
        'variants.scaled-medium',
        `variants.${variantPrefix}`,
        `variants.${variantPrefix}-2x`,
      ],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      'limit.images': 1,
    },
    config
  );
  return dispatch(searchListingsCall);
};