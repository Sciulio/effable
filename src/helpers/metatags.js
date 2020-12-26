const { merge } = require('lodash');

const { through, flatten } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')


const deleteNullish = obj => {
  Object.entries(obj)
  .filter(([key, value]) => value === '' || value === null || value === undefined)
  .forEach(([key, value]) => {
    delete obj[key];
  });

  return obj;
};

const generateBaseMetatags = (_, { title }) => ({
  title: [
    title
  ]
});

const generateSeoTags = ({ url, location }, { title, slug, description, locale, canonical, author, copyright, keywords }) => ({
  meta: {
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
  }
});

const generateCacheTags = (route, { cache, refresh, "content-type": contentType = "text/html; charset=UTF-8" }) => ({
  meta: {
    "http-equiv": {
      ...(cache === false && { "cache-control": "no-cache" }),
      ...(cache !== false && typeof cache !== 'undefined' && { "expires": cache }),
      ...(!!refresh && { refresh }),
      "content-type": contentType
    }
  }
});

const generateConfigTags = ({ url }, { robots, viewport, charset, locale }) => {
  return {
    meta: {
      name: deleteNullish({
        robots: robots || 'index, follow',
        viewport: viewport || 'width=device-width, initial-scale=1.0, user-scalable=no',
        charset: charset || 'UTF-8',
        locale: locale || 'it-IT'
      })
    }
  }
}

const generateOpenGraphTags = ({ url }, { title, description, locale, canonical, og = {} }) => ({
  meta: {
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
  }
});
const generateTwitterTags = ({ url }, { title, description, twitter = {}, og = {} }) => ({
  meta: {
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
  }
});
const generateFbTags = () => ({
  meta: {
    property: deleteNullish({
      'fb:admins': '',
    })
  }
});

// todo: content-security-policy => parse all site to
// todo: content-type => defaults to <meta http-equiv="content-type" content="text/html; charset=UTF-8">
// todo: default-style
// todo: refresh => <meta http-equiv="refresh" content="30">

const generateBindings = (route, metadata, fullList) => merge(
  ...through(
    generateBaseMetatags,
    generateSeoTags,
    generateCacheTags,
    generateConfigTags
  )(route, metadata),
  ...(fullList && through(
    generateOpenGraphTags,
    generateTwitterTags,
    generateFbTags
  )(route, metadata))
);

module.exports = {
  generateHtmlMetatags: (route, metadata, fullList = true) => flatten(
    Object.entries(generateBindings(route, metadata, fullList))
    .map(([tag, values]) => {
      if (Array.isArray(values)) {
        return values.map(inner => `<${tag}>${inner}</${tag}>`)
      }
      return flatten(Object.entries(values)
      .map(([attr, subValues]) => Object.entries(subValues)
        .map(([attrValue, content]) => `<${tag} ${attr}="${attrValue}" content="${content}" />`)
      ))
    })
  )
};

/*
registerHook(
  'routes.generate.metatags',
  async (route) => {
    const { metadata } = route;

    route.metatags = merge(
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
*/