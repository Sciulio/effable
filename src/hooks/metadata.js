const { URL } = require('url')

const { merge } = require('lodash');

const { registerHook } = require('../utils/hooks')


const isAbsoluteUrl = url => url.indexOf('http') == 0;
const extrapolateUrls = (props, metadata, preUrl) => props
.map(prop => [prop, metadata[prop]])
.filter(([prop, value]) => prop in metadata && typeof value !== 'undefined' && value !== null)
.filter(([prop, value]) => !isAbsoluteUrl(value))
.forEach(([prop, value]) => {
  // todo
  metadata[prop] = new URL(metadata[prop], preUrl).toString();
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
    extrapolateUrls(['image'], metadata, resxUrl);
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