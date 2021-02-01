const { URL } = require('url')

const { merge } = require('lodash');

const { registerHook } = require('../utils/hooks')


const isAbsoluteUrl = url => url.indexOf('http') == 0;
const extrapolateUrls = (matchers, metadata, preUrl) => Object.entries(metadata)
.filter(([prop]) => matchers.some(matcher => typeof matcher === 'string' ? matcher == prop : prop.match(matcher)))
.filter(([_, value]) => typeof value !== 'undefined' && value !== null)
.filter(([_, value]) => !isAbsoluteUrl(value))
.forEach(([prop, value]) => {
  metadata[prop] = new URL(value, preUrl).toString();
});
/* todo: use converter
example:
  date, defaults to zulu
    date: '[date(dd-mm-yyyy)]:12-05-1980'
  urls
    externalUrl
*/

registerHook(
  'files.all.metadata',
  async ({ metadata }, { config: { host: { baseUrl, resxUrl } }}) => {
    extrapolateUrls(['canonical'], metadata, baseUrl);
    extrapolateUrls(['image', /^image-/], metadata, resxUrl);
  }
);

registerHook(
  'routes.generate.metadata',
  async (route) => {
    const { contentFile, templateFile } = route;

    const metadata = merge(
      {},
      templateFile.metadata,
      contentFile ? contentFile.metadata : null
    );

    route.metadata = metadata;
  }
);