const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const { types } = require('sharetribe-flex-sdk');

const buildPath = path.resolve(__dirname, '..', 'build');
const indexHtml = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf-8');

const reNoMatch = /($^)/;

const templateWithHtmlAttributes = _.template(indexHtml, {
  interpolate: /data-htmlattr=\"([\s\S]+?)\"/g,
  evaluate: reNoMatch,
  escape: reNoMatch,
});

const templateTags = templatedWithHtmlAttributes =>
  _.template(templatedWithHtmlAttributes, {
    interpolate: /<!--!([\s\S]+?)-->/g,
    evaluate: reNoMatch,
    escape: reNoMatch,
  });

const template = params => {
  const htmlAttributes = params.htmlAttributes;
  const tags = _.omit(params, ['htmlAttributes']);
  const templatedWithHtmlAttributes = templateWithHtmlAttributes({ htmlAttributes });
  return templateTags(templatedWithHtmlAttributes)(tags);
};

const cleanErrorValue = value => {
  if (value instanceof Error) {
    const { name, message, status, statusText, apiErrors } = value;
    return { type: 'error', name, message, status, statusText, apiErrors };
  }
  return value;
};

const replacer = (key = null, value) => {
  const cleanedValue = cleanErrorValue(value);
  return types.replacer(key, cleanedValue);
};

exports.render = async function (requestUrl, context, data, renderApp, webExtractor, nonce) {
  try {
    const { preloadedState, translations, hostedConfig } = data;
    const collectWebChunks = webExtractor.collectChunks.bind(webExtractor);

    // If renderApp is async (which it should be), await it
    const result = await renderApp(
      requestUrl,
      context,
      preloadedState,
      translations,
      hostedConfig,
      collectWebChunks
    );

    const { head, body } = result;

    const serializedState = JSON.stringify(preloadedState, replacer).replace(/</g, '\\u003c');
    const nonceMaybe = nonce ? `nonce="${nonce}"` : '';
    const preloadedStateScript = `
      <script ${nonceMaybe}>window.__PRELOADED_STATE__ = ${JSON.stringify(serializedState)};</script>
    `;
    const nonceParamMaybe = nonce ? { nonce } : {};

    return template({
      htmlAttributes: head.htmlAttributes.toString(),
      title: head.title.toString(),
      link: head.link.toString(),
      meta: head.meta.toString(),
      script: head.script.toString(),
      preloadedStateScript,
      ssrStyles: webExtractor.getStyleTags(),
      ssrLinks: webExtractor.getLinkTags(),
      ssrScripts: webExtractor.getScriptTags(nonceParamMaybe),
      body,
    });
  } catch (error) {
    console.error('renderApp failed:', error);
    return `
      <html>
        <head><title>SSR Error</title></head>
        <body>
          <h1>Oops! Server-side rendering failed.</h1>
          <pre>${JSON.stringify(cleanErrorValue(error), null, 2)}</pre>
        </body>
      </html>
    `;
  }
};
