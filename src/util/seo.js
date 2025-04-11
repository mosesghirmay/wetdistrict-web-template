import simpleYachtImage from '../assets/simpleyacht.jpg';

const ensureOpenGraphLocale = locale => {
  switch (locale) {
    case 'en':
      return 'en_US';
    default:
      return locale;
  }
};

/**
 * These will be used with Helmet <meta {...openGraphMetaProps} />
 */
export const openGraphMetaProps = data => {
  const {
    openGraphType,
    socialSharingTitle,
    socialSharingDescription,
    published,
    updated,
    url,
    locale,
    facebookImages = [{ url: simpleYachtImage, width: 1200, height: 630 }],
    facebookAppId,
    marketplaceName,
  } = data;

  if (!(socialSharingTitle && socialSharingDescription && openGraphType && url && facebookImages)) {
    if (console && console.warn) {
      console.warn(
        `Can't create Open Graph meta tags:
        socialSharingTitle, socialSharingDescription, openGraphType, url, and facebookImages are needed.`
      );
    }
    return [];
  }

  const openGraphMeta = [
    { property: 'og:description', content: socialSharingDescription },
    { property: 'og:title', content: socialSharingTitle },
    { property: 'og:type', content: openGraphType },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: ensureOpenGraphLocale(locale) },
  ];

  facebookImages.forEach(i => {
    openGraphMeta.push({ property: 'og:image', content: i.url });
    if (i.width && i.height) {
      openGraphMeta.push({ property: 'og:image:width', content: i.width });
      openGraphMeta.push({ property: 'og:image:height', content: i.height });
    }
  });

  if (marketplaceName) {
    openGraphMeta.push({ property: 'og:site_name', content: marketplaceName });
  }

  if (facebookAppId) {
    openGraphMeta.push({ property: 'fb:app_id', content: facebookAppId });
  }

  if (published) {
    openGraphMeta.push({ property: 'article:published_time', content: published });
  }

  if (updated) {
    openGraphMeta.push({ property: 'article:modified_time', content: updated });
  }

  return openGraphMeta;
};

/**
 * These will be used with Helmet <meta {...twitterMetaProps} />
 */
export const twitterMetaProps = data => {
  const {
    socialSharingTitle,
    socialSharingDescription,
    twitterHandle,
    twitterImages = [{ url: simpleYachtImage }],
    url,
    marketplaceRootURL,
    siteTwitterHandle,
  } = data;

  if (!(socialSharingTitle && socialSharingDescription && url)) {
    if (console && console.warn) {
      console.warn(
        `Can't create twitter card meta tags:
        socialSharingTitle, socialSharingDescription, and url are needed.`
      );
    }
    return [];
  }

  const twitterMeta = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: socialSharingTitle },
    { name: 'twitter:description', content: socialSharingDescription },
    { name: 'twitter:url', content: url },
  ];

  if (siteTwitterHandle) {
    twitterMeta.push({ name: 'twitter:site', content: siteTwitterHandle });
  }

  twitterImages.forEach(i => {
    twitterMeta.push({ name: 'twitter:image', content: i.url });
  });

  if (twitterHandle) {
    twitterMeta.push({ name: 'twitter:creator', content: twitterHandle });
  }

  if (marketplaceRootURL) {
    twitterMeta.push({ name: 'twitter:domain', content: marketplaceRootURL });
  }

  return twitterMeta;
};

/**
 * These will be used with Helmet <meta {...metaTagProps} />
 */
export const metaTagProps = (tagData, config) => {
  const {
    marketplaceRootURL,
    facebookAppId,
    marketplaceName,
    siteTwitterHandle,
    googleSearchConsole,
  } = config;

  const author = tagData.author || marketplaceName;
  const googleSiteVerification = googleSearchConsole?.googleSiteVerification;
  const googleSiteVerificationMaybe = googleSiteVerification
    ? [{ name: 'google-site-verification', content: googleSiteVerification }]
    : [];
  const defaultMeta = [
    { name: 'description', content: tagData.description },
    { name: 'author', content: author },
    ...googleSiteVerificationMaybe,
  ];

  const openGraphMeta = openGraphMetaProps({
    ...tagData,
    facebookAppId,
    marketplaceName,
  });

  const twitterMeta = twitterMetaProps({
    ...tagData,
    marketplaceRootURL,
    siteTwitterHandle,
  });

  return [...defaultMeta, ...openGraphMeta, ...twitterMeta];
};
