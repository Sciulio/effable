const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { URL } = require('url')

const { merge } = require('lodash');

const { emitHook, registerHook } = require('../utils/hooks')


const reduceMetadata = (tags) => metadata => tags
.reduce((tagsSet, meta) => ({
  ...tagsSet,
  [meta]: metadata[meta]
}), {});

const generateSeoTags = ({ url, location }, { title, slug, description, locale, canonical, author, copyright, keywords }) => ({
  name: {
    slug: slug || url,
    title, // 60-70
    description, // -155
    locale,
    canonical,
    author,
    copyright,
    keywords
  }
});
const generateOpenGraphTags = ({ url }, { title, description, locale, canonical, og = {} }) => ({
  property: {
    'og:title': title, // title to all sharable pages (40 mobile, 60 desktop)
    'og:url': canonical,
    'og:description': description, // (2-4 sentences) ... Get from SEO newbie to SEO pro in 8 simple steps.
    'og:locale': locale,
    //'og:site_name': ...,
    'og:type': 'website', // website|article
    // image => 1.91:1 ratio, min 1200x630
    ...Object.entries(og)
    .reduce((res, [prop, value]) => ({
      ...res,
      ['og:' + prop]: value
    }), {})
  }
});
const generateTwitterTags = ({ url }, { title, description, twitter = {}, og = {} }) => ({
  name: {
    'twitter:card': 'summary',
    //TODO 'twitter:site': '',
    'twitter:title': title,
    'twitter:description': description,
    //TODO 'twitter:creator': '',
    //TODO 'twitter:image': '',
    ...Object.entries(twitter)
    .reduce((res, [prop, value]) => ({
      ...res,
      ['twitter:' + prop]: value || og[prop]
    }), {})
  }
});
const generateFbTags = () => ({
  property: {
    'fb:admins': '',
  }
});

const generateCacheTags = (route, { cache }) => {
  if (cache == false) {
    return {
      "http-equiv": {
        "cache-control": "no-cache"
      }
    }
  } else if (typeof cache !== 'undefined') {
    return {
      "http-equiv": {
        "expires": cache
      }
    }
  }
}
const generateConfigTags = ({ url }, { robots, viewport, charset, locale }) => {
  return {
    name: {
      robots: robots || 'index, follow',
      viewport: viewport || 'width=device-width, initial-scale=1.0, user-scalable=no',
      charset: charset || 'UTF-8',
      locale: locale || 'it-IT'
    }
  }
}

const isAbsoluteUrl = url => url.indexOf('http') == 0;
const extrapolateSet = (props, metadata, preUrl) => props
.map(prop => [prop, metadata[prop]])
.filter(([prop, value]) => prop in metadata && typeof value !== 'undefined' && value !== null)
.filter(([prop, value]) => !isAbsoluteUrl(value))
.forEach(([prop, value]) => {
  // todo
  metadata[prop] = new URL(metadata[prop], preUrl).toString();
});
registerHook(
  'prepare.metadata',
  async ({ metadata }, { config: { host: { baseUrl, resxUrl } }}) => {
    extrapolateSet(['canonical'], metadata, baseUrl);
    extrapolateSet(['image'], metadata, resxUrl);
    console.log(metadata)
  }
);

registerHook(
  'routes.generate.meta',
  async (route, { data }) => {
    const { contentFile, templateFile } = route;

    const metadata = merge(
      {},
      templateFile.metadata,
      contentFile ? contentFile.metadata : null
    );
    const meta = merge(
      {},
      generateSeoTags(route, metadata),
      generateOpenGraphTags(route, metadata),
      generateTwitterTags(route, metadata),
      generateFbTags(route, metadata),
      generateCacheTags(route, metadata),
      generateConfigTags(route, metadata)
    );

    route.metadata = metadata;
    route.meta = meta;
  }
);