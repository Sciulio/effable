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

const generateBaseMetatags = (_, { title, charset = 'UTF-8' }) => ({
  title: [
    title
  ],
  meta: {
    charset
  }
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

const generateCacheTags = (route, { cache, refresh, "content-type": contentType = "text/html;charset=UTF-8" }) => ({
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
        // Mobile Metas
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
// todo: default-style

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
      return flatten(
        Object.entries(values)
        .map(([attr, subValues]) => typeof subValues === 'object' ? Object.entries(subValues)
          .map(([attrValue, content]) => `<${tag} ${attr}="${attrValue}" ${content ? `content="${content}"` : ''} />`) : [
            `<${tag} ${attr}="${subValues}" />`
          ]
        )
      )
    })
  )
};