/**
 * SelectMultipleFilter needs to parse values from format
 * "has_all:a,b,c,d" or "a,b,c,d"
 */
export const parseSelectFilterOptions = uriComponentValue => {
  const startsWithHasAll = uriComponentValue && uriComponentValue.indexOf('has_all:') === 0;
  const startsWithHasAny = uriComponentValue && uriComponentValue.indexOf('has_any:') === 0;

  if (startsWithHasAll) {
    return uriComponentValue.substring(8).split(',');
  } else if (startsWithHasAny) {
    return uriComponentValue.substring(8).split(',');
  } else {
    return uriComponentValue.split(',');
  }
};

/**
 * Create the name of the query parameter.
 *
 * @param {String} key Key extracted from listingExtendData config.
 * @param {String} scope Scope extracted from listingExtendData config.
 */
export const constructQueryParamName = (key, scope) => {
  const prefixedKey = scope === 'meta' ? `meta_${key}` : `pub_${key}`;
  return prefixedKey.replace(/\s/g, '_');
};

/**
 * Get parameter names for search query. Extract those from config.
 * The configuration of default filters has key, which is 1-on-1 mapping
 * with the name of the query parameter. E.g. 'price'.
 *
 * @param {Object} listingFieldsConfig Custom filters are checked against extended data config of a listing entity.
 * @param {Object} defaultFiltersConfig Configuration of default filters.
 */
export const getQueryParamNames = (listingFieldsConfig = [], defaultFiltersConfig = []) => {
  if (!Array.isArray(listingFieldsConfig) || !Array.isArray(defaultFiltersConfig)) {
    console.error("Invalid arguments passed to getQueryParamNames");
    return [];
  }

  const queryParamKeysOfDefaultFilters = defaultFiltersConfig.map(config => config.key);
  const queryParamKeysOfListingFields = listingFieldsConfig.reduce((params, config) => {
    if (!config || !config.key || !config.scope) return params;
    const param = constructQueryParamName(config.key, config.scope);
    return config.filterConfig?.indexForSearch ? [...params, param] : params;
  }, []);

  return [...queryParamKeysOfDefaultFilters, ...queryParamKeysOfListingFields];
};

/**
 * Check if any of the filters (defined by filterKeys) have currently active query parameter in URL.
 */
export const isAnyFilterActive = (
  filterKeys = [],
  urlQueryParams = {},
  listingFieldsConfig = [],
  defaultFiltersConfig = []
) => {
  const queryParamKeys = getQueryParamNames(listingFieldsConfig, defaultFiltersConfig);

  const getQueryParamKeysOfGivenFilters = (pickedKeys, key) => {
    const isFilterIncluded = filterKeys.includes(key);
    const addedQueryParamNamesMaybe = isFilterIncluded ? [key] : [];
    return [...pickedKeys, ...addedQueryParamNamesMaybe];
  };
  const queryParamKeysOfGivenFilters = queryParamKeys.reduce(getQueryParamKeysOfGivenFilters, []);

  const paramEntries = Object.entries(urlQueryParams);
  const activeKey = paramEntries.find(entry => {
    const [key, value] = entry;
    return queryParamKeysOfGivenFilters.includes(key) && value != null;
  });

  return !!activeKey;
};

/**
 * Check if the main search type is 'keywords'
 */
export const isMainSearchTypeKeywords = config =>
  config?.search?.mainSearch?.searchType === 'keywords';

/**
 * Check if the origin parameter is currently active.
 */
export const isOriginInUse = config =>
  config?.search?.mainSearch?.searchType === 'location' && config?.maps?.search?.sortSearchByDistance;

/**
 * Check if the stock management is currently active.
 */
export const isStockInUse = config => {
  const listingTypes = config?.listing?.listingTypes || [];
  const stockProcesses = ['default-purchase'];

  return listingTypes.some(conf => stockProcesses.includes(conf.transactionType?.process));
};

/**
 * Convert categories to tree format for field selection.
 */
export const convertCategoriesToSelectTreeOptions = (categories = []) => {
  return categories.map(category => ({
    value: category.id,
    label: category.name,
    children: category.subcategories ? convertCategoriesToSelectTreeOptions(category.subcategories) : [],
  }));
};

/**
 * Extract initial values for field selection.
 */
export const pickInitialValuesForFieldSelectTree = (selectedValues = [], availableOptions = []) => {
  return selectedValues.filter(value => availableOptions.some(option => option.value === value));
};

/**
 * Extract only the necessary search params.
 */
export const pickSearchParamsOnly = (params = {}, allowedKeys = []) => {
  return Object.keys(params)
    .filter(key => allowedKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});
};

/**
 * Function to omit certain listing field parameters from search.
 */
export const omitLimitedListingFieldParams = (params = {}, excludedKeys = []) => {
  return Object.keys(params)
    .filter(key => !excludedKeys.includes(key))
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {});
};

/**
 * Function to retrieve valid filter params.
 */
export const validFilterParams = params => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};
