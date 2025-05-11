/**
 * Utility to add extra meta tags for social sharing
 * This helps with iMessage link previews which can be problematic
 */

const getExtraMetaTags = (rootUrl) => {
  const imageUrl = `${rootUrl}/images/wetdistrict-imessage-preview.jpg`;
  
  return `
    <!-- Enhanced meta tags for social sharing and especially iMessage previews -->
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Yacht rental - WETDISTRICT">
    
    <!-- iOS specific meta tags -->
    <link rel="apple-touch-icon" href="${imageUrl}">
    <meta name="apple-mobile-web-app-title" content="WETDISTRICT">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    
    <!-- Legacy meta tags for broader compatibility -->
    <meta name="thumbnail" content="${imageUrl}">
    <link rel="image_src" href="${imageUrl}">
    <meta itemprop="image" content="${imageUrl}">
  `;
};

module.exports = { getExtraMetaTags };