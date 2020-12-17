const { merge } = require('lodash');

const { through } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')


const deleteNullish = obj => {
  Object.entries(obj)
  .filter(([key, value]) => value === '' || value === null || value === undefined)
  .forEach(([key, value]) => {
    delete obj[key];
  });

  return obj;
};

const generateSeoTags = ({ url, location }, { title, slug, description, locale, canonical, author, copyright, keywords }) => ({
  name: deleteNullish({
    slug: slug || url,
    title, // 60-70
    description, // -155
    locale,
    canonical,
    author,
    copyright,
    keywords
  })
});
const generateOpenGraphTags = ({ url }, { title, description, locale, canonical, og = {} }) => ({
  property: deleteNullish({
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
  })
});
const generateTwitterTags = ({ url }, { title, description, twitter = {}, og = {} }) => ({
  name: deleteNullish({
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
  })
});
const generateFbTags = () => ({
  property: deleteNullish({
    'fb:admins': '',
  })
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
    name: deleteNullish({
      robots: robots || 'index, follow',
      viewport: viewport || 'width=device-width, initial-scale=1.0, user-scalable=no',
      charset: charset || 'UTF-8',
      locale: locale || 'it-IT'
    })
  }
}

registerHook(
  'routes.generate.meta',
  async (route) => {
    const { metadata } = route;
    
    route.meta = merge(
      {},
      ...through(
        generateSeoTags,
        generateOpenGraphTags,
        generateTwitterTags,
        generateFbTags,
        generateCacheTags,
        generateConfigTags
      )(route, metadata)
    );
  }
);