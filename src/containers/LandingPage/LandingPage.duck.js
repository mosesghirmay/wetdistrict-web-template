import { loadData as search } from '../SearchPage/SearchPage.duck';

export const ASSET_NAME = 'landing-page';

// Use the same loadData function as SearchPage, but with some default parameters
export const loadData = (params, searchQuery, config) => {
  // Use the same search function from SearchPage but with customized default parameters
  const defaultSearchParams = {
    ...params,
    perPage: 24,
    sort: 'createdAt',
  };
  
  return search(defaultSearchParams, searchQuery, config);
};
