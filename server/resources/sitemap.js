const { Readable } = require('stream');
const { SitemapIndexStream, SitemapStream, streamToPromise } = require('sitemap');
const log = require('../log.js');
const { getRootURL } = require('../api-util/rootURL.js');
const sdkUtils = require('../api-util/sdk.js');

const isSitemapDisabled = process.env.SITEMAP_DISABLED === 'true';
const dev = process.env.REACT_APP_ENV === 'development';

///////////////////////////////////////////////////////////////////////////////
// This file generates sitemaps.                                             //
// 1. The robotsTxt.js adds link to the sitemap-index.xml                    //
// 2. sitemap-index.xml links to 3 different sub sitemaps:                   //
//   a. sitemap-default.xml                                                  //
//     - Contains links to public built-in pages of the client app.          //
//     - It also shows landing-page, terms-of-service and privacy-policy     //
//       pages as they have fixed paths unlike other CMS pages.              //
//   b. sitemap-recent-listings.xml                                          //
//     - This returns max 10 000 recent listings                             //
//   c. sitemap-recent-pages.xml                                             //
//     - This contains Pages, which are shown from path /p/:pageId           //
//     - Does not contain landing-page, terms-of-service and privacy-policy  //
//                                                                           //
// Note: There's simple memory cache in use (ttl = 1 day).                   //
//       These middlewares also add cache control headers, but googlebot     //
//       does not respect those.                                             //
//       Other tags than <loc> are omitted:                                  //
//       - Google ignores <priority> and <changefreq> values.                //
//       - Google uses the <lastmod> value only if it's consistently and     //
//         verifiably accurate. This is hard to detect reliably on API level //
//         as data entity might have changed, but page UI is not.            //
///////////////////////////////////////////////////////////////////////////////

// The default sitemap (/sitemap-default.xml) contains public built-in pages.
// If you create new pages that are accessible by unauthenticated user,
// you can add them here.
//
// Note 1: The value of these key-value pairs should be:
//         { url: '/path/to/the/page' }
//
// Note 2: landing page (/), /terms-of-service, and /privacy-policy are fixed routes on this client app
//       even though the content comes from hosted assets
//
// Note 3: You can add relevant searches here
//         E.g. searchHats: { url: '/s?pub_category=hats' },
const defaultPublicPaths = {
  landingPage: { url: '/' },
  termsOfService: { url: '/terms-of-service' },
  privacyPolicy: { url: '/privacy-policy' },
  signup: { url: '/signup' },
  login: { url: '/login' },
  search: { url: '/s' },
};

// Time-to-live (ttl) is set to one day aka 86400 seconds
const ttl = 86400; // seconds

// This creates simple (proxied) memory cache
const createCacheProxy = ttl => {
  const cache = {};
  return new Proxy(cache, {
    // Get data for the property together with timestamp
    get(target, property, receiver) {
      const cachedData = target[property];
      if (!!cachedData) {
        // Check if the cached data has expired
        if (Date.now() - cachedData.timestamp < ttl * 1000) {
          return cachedData;
        }
      }
      return { data: null, timestamp: cachedData?.timestamp || Date.now() };
    },
    // Set given value as data to property accompanied with timestamp
    set(target, property, value, receiver) {
      target[property] = { data: value, timestamp: Date.now() };
    },
  });
};

const cache = createCacheProxy(ttl);

/////////////////////////////////////////////
// Handlers for /sitemap-* prefixed routes //
/////////////////////////////////////////////

/**
 * This sitemap-index.xml links to 3 different sub sitemaps:
 * - sitemap-default.xml
 * - sitemap-recent-listings.xml
 * - sitemap-recent-pages.xml
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {String} rootUrl location from where these sitemap paths can be found
 * @param {Boolean} isPrivateMarketplace is private marketplace mode set
 */
const sitemapIndex = (req, res, rootUrl, isPrivateMarketplace) => {
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': `public, max-age=${ttl}`,
  });

  // If we have a cached content send it
  const { data, timestamp } = cache.sitemapIndex;
  if (data && timestamp) {
    const age = Math.floor((Date.now() - timestamp) / 1000);
    res.set('Age', age);
    if (!res.headersSent) {
      res.send(data);
    } else {
      console.warn('Headers already sent — skipping response.');
    }
    return;
  }

  try {
    const smiStream = new SitemapIndexStream({ level: 'warn' });

    // Sitemap-index will contain the following sitemaps:
    const sitemaps = isPrivateMarketplace
      ? ['/sitemap-default.xml', '/sitemap-recent-pages.xml']
      : ['/sitemap-default.xml', '/sitemap-recent-listings.xml', '/sitemap-recent-pages.xml'];

    // Add sitemaps to the index
    sitemaps.forEach(sitemapPath => {
      smiStream.write({ url: `${rootUrl}${sitemapPath}` });
    });

    streamToPromise(smiStream).then(sm => (cache.sitemapIndex = sm));

    smiStream.pipe(res).on('error', e => {
      if (!res.headersSent) {
        log.error(e, 'sitemap-index-stream-error');
        res.status(500).end();
      } else {
        console.warn('Headers already sent — skipping response.');
      }
    });

    // Since we manually add content to the stream, we need to close it.
    smiStream.end();
  } catch (e) {
    if (!res.headersSent) {
      log.error(e, 'sitemap-index-render-failed');
      res.status(500).end();
    } else {
      console.warn('Headers already sent — skipping response.');
    }
  }
};

/**
 * The default sitemap contains links to public built-in pages of the client app.
 * It also shows landing-page, terms-of-service, and privacy-policy pages
 * as they have fixed paths unlike other CMS pages.
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {String} rootUrl location from where these sitemap paths can be found
 * @param {Boolean} isPrivateMarketplace is private marketplace mode set
 */
const sitemapDefault = (req, res, rootUrl, isPrivateMarketplace) => {
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': `public, max-age=${ttl}`,
  });

  // If we have a cached content send it
  const { data, timestamp } = cache.sitemapDefault;
  if (data && timestamp) {
    const age = Math.floor((Date.now() - timestamp) / 1000);
    res.set('Age', age);
    if (!res.headersSent) {
      res.send(data);
    } else {
      console.warn('Headers already sent — skipping response.');
    }
    return;
  }

  try {
    const smStream = new SitemapStream({ hostname: rootUrl });

    // Pass default public paths to SitemapStream.
    // These are defined in the beginning of the page
    const { search, ...restOfPaths } = defaultPublicPaths;
    const publicPaths = isPrivateMarketplace ? restOfPaths : defaultPublicPaths;

    const paths = Object.values(publicPaths);
    Readable.from(paths).pipe(smStream);

    // Save to in-memory cache
    streamToPromise(smStream).then(sm => (cache.sitemapDefault = sm));

    // Write the stream to the response
    smStream.pipe(res).on('error', e => {
      if (!res.headersSent) {
        log.error(e, 'sitemap-default-stream-error');
        res.status(500).end();
      } else {
        console.warn('Headers already sent — skipping response.');
      }
    });
  } catch (e) {
    if (!res.headersSent) {
      log.error(e, 'sitemap-default-render-failed');
      res.status(500).end();
    } else {
      console.warn('Headers already sent — skipping response.');
    }
  }
};

/**
 * This recent listings sitemap returns max 10 000 listings.
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {String} rootUrl location from where these sitemap paths can be found
 * @param {Object} sdk
 */
const sitemapListings = (req, res, rootUrl, sdk) => {
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': `public, max-age=${ttl}`,
  });

  // If we have a cached content send it
  const { data, timestamp } = cache.sitemapRecentListings;
  if (data && timestamp) {
    const age = Math.floor((Date.now() - timestamp) / 1000);
    res.set('Age', age);
    if (!res.headersSent) {
      res.send(data);
    } else {
      console.warn('Headers already sent — skipping response.');
    }
    return;
  }

  sdk.sitemapData
    .queryListings()
    .then(response => {
      // If headers have already been sent, we can't continue
      if (res.headersSent) {
        console.warn('Headers already sent, cannot send sitemap response');
        return;
      }
      
      const listings = response.data.data || [];
      // Use canonical URL: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
      const ids = listings.map(l => `l/${l.id?.uuid}`);

      // If there's no listings, let's just return empty sitemap
      const hasListingIds = ids.length > 0;
      if (!hasListingIds) {
        if (!res.headersSent) {
          return res.send(
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`
          );
        } else {
          console.warn('Headers already sent — skipping response.');
          return;
        }
      }

      const smStream = new SitemapStream({ hostname: rootUrl });
      Readable.from(ids).pipe(smStream);

      // Save to in-memory cache
      streamToPromise(smStream).then(sm => (cache.sitemapRecentListings = sm));

      // Write the stream to the response
      smStream.pipe(res).on('error', e => {
        if (!res.headersSent) {
          log.error(e, 'sitemap-stream-error');
          res.status(500).end();
        } else {
          console.warn('Headers already sent — skipping response.');
        }
      });
    })
    .catch(e => {
      // If headers have already been sent, we can't continue
      if (res.headersSent) {
        console.warn('Headers already sent, cannot send error response');
        return;
      }
      
      // Private marketplace mode might throw
      if (e.status === 403) {
        if (!res.headersSent) {
          return res.send(
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`
          );
        } else {
          console.warn('Headers already sent — skipping response.');
          return;
        }
      }
      log.error(e, 'sitemap-recent-listings-render-failed');
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        console.warn('Headers already sent — skipping response.');
      }
    });
};

/**
 * The recent pages sitemap contains Pages, which are shown from path /p/:pageId
 * However, it does not contain landing-page, terms-of-service and privacy-policy
 * as those pages have hard-coded paths too: '/', '/terms-of-service', adn '/privacy-policy'.
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {String} rootUrl location from where these sitemap paths can be found
 * @param {Object} sdk
 */
const sitemapPages = (req, res, rootUrl, sdk) => {
  res.set({
    'Content-Type': 'application/xml',
    'Cache-Control': `public, max-age=${ttl}`,
  });

  // If we have a cached content send it
  const { data, timestamp } = cache.sitemapRecentPages;
  if (data && timestamp) {
    const age = Math.floor((Date.now() - timestamp) / 1000);
    res.set('Age', age);
    if (!res.headersSent) {
      res.send(data);
    } else {
      console.warn('Headers already sent — skipping response.');
    }
    return;
  }

  const pathPrefix = '/content/pages/';
  sdk.sitemapData
    .queryAssets({ pathPrefix })
    .then(response => {
      // If headers have already been sent, we can't continue
      if (res.headersSent) {
        console.warn('Headers already sent, cannot send sitemap pages response');
        return;
      }
      
      const assets = response.data.data || [];

      // If there's no Pages, let's just return empty sitemap
      const hasAssets = assets.length > 0;
      if (!hasAssets) {
        if (!res.headersSent) {
          return res.send(
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`
          );
        } else {
          console.warn('Headers already sent — skipping response.');
          return;
        }
      }

      // Pick those asset paths that CMSPage component renders
      const cmsPagePaths = assets.reduce((picked, asset) => {
        const assetFileName = asset.attributes?.assetPath?.slice(pathPrefix.length);
        const assetName = assetFileName.split('.')[0];
        const permanentPaths = ['landing-page', 'terms-of-service', 'privacy-policy'];
        return permanentPaths.includes(assetName) ? picked : [...picked, `p/${assetName}`];
      }, []);

      const smStream = new SitemapStream({ hostname: rootUrl });
      Readable.from(cmsPagePaths).pipe(smStream);

      // Save to in-memory cache
      streamToPromise(smStream).then(sm => (cache.sitemapRecentPages = sm));

      // stream write the response
      smStream.pipe(res).on('error', e => {
        if (!res.headersSent) {
          log.error(e, 'sitemap-stream-error');
          res.status(500).end();
        } else {
          console.warn('Headers already sent — skipping response.');
        }
      });
    })
    .catch(e => {
      if (!res.headersSent) {
        log.error(e, 'sitemap-recent-pages-render-failed');
        res.status(500).end();
      } else {
        console.warn('Headers already sent — skipping response.');
      }
    });
};

/**
 * Render different sitemap resources.
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {function} next
 * @param {Object} sdk
 * @param {Boolean} isPrivateMarketplace
 */
const handleSitemaps = (req, res, next, sdk, isPrivateMarketplace) => {
  const resource = req.params.resource;
  const parts = resource.split('.');
  const sitemapResource = parts[0];
  // Resolve hostname inside the request
  const rootUrl = getRootURL();

  if (sitemapResource === 'index') {
    sitemapIndex(req, res, getRootURL({ useDevApiServerPort: true }), isPrivateMarketplace);
  } else if (sitemapResource === 'default') {
    sitemapDefault(req, res, rootUrl, isPrivateMarketplace);
  } else if (sitemapResource === 'recent-listings' && !isPrivateMarketplace) {
    sitemapListings(req, res, rootUrl, sdk);
  } else if (sitemapResource === 'recent-pages') {
    sitemapPages(req, res, rootUrl, sdk);
  } else {
    // If none of the resource-routes mapped, we pass this forward.
    next();
  }
};
/**
 * Route: "sitemap-:resource". resouce can point to index, default, recent-listings, or recent-pages.
 *
 * @param {Object} req request
 * @param {Object} res response
 * @param {function} next
 */
module.exports = (req, res, next) => {
  // Making it a bit faster to react to DDOS attacks, since the generation is a bit resource intensive.
  // You might want to consider adding cron job and avoid sitemap generation on request time.
  if (isSitemapDisabled) {
    if (!res.headersSent) {
      res.status(503).end();
      console.log('Sitemap functionality is disabled.');
      return;
    } else {
      console.warn('Headers already sent — skipping response.');
      return;
    }
  }

  const sdk = sdkUtils.getSdk(req, res);
  sdkUtils
    .fetchAccessControlAsset(sdk)
    .then(response => {
      const accessControlAsset = response.data.data[0];

      const { marketplace } =
        accessControlAsset?.type === 'jsonAsset' ? accessControlAsset.attributes.data : {};
      const isPrivateMarketplace = marketplace?.private === true;
      handleSitemaps(req, res, next, sdk, isPrivateMarketplace);
    })
    .catch(e => {
      const is404 = e.status === 404;
      if (is404) {
        // If access-control.json asset is not found, we default to "public" marketplace.
        handleSitemaps(req, res, next, sdk, false);

        if (dev) {
          // Log error
          console.log('sitemap-render-failed-no-asset-found');
        }
      } else {
        next();
      }
    });
};
