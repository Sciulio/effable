const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { set, get } = require('lodash');

const { filterByExt } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')
const { pathToProperty, urlToPath } = require('../utils/fs')

let Handlebars = require('handlebars')
require('../helpers/hbs');


const hooksFilter = filterByExt('.hbs');

const tinyRouteFactory = ({ url, location, metadata, __isContent = false }) => ({
  ...metadata,
  __isContent,
  url,
  location
});

registerHook(
  'modules.init',
  async ({ handlebars = handlebars => handlebars }) => {
    Handlebars = handlebars(Handlebars) || Handlebars;
  }
);

registerHook(
  'files.partials.generate',
  hooksFilter,
  async ({ name, folder, content }) => {
    const fullName = pathToProperty(folder, name);
    Handlebars.registerPartial(fullName, content);
  }
);

registerHook(
  'routes.prologo',
  async ctx => {
    const { routes } = ctx;

    ctx.routesSet = routes.map(tinyRouteFactory)
    .reduce((tinyRoutesSet, tinyRoute) => set(
      tinyRoutesSet,
      urlToPath(tinyRoute.url),
      tinyRoute
    ), {});
  }
);

registerHook(
  'routes.render.views',
  async (route, { data, routesSet, config: { host } }) => {
    const { url, metadata, meta, contentFile, templateFile, contentData } = route;

    const context = {
      host,

      data,

      routes: routesSet,
      route: get(routesSet, urlToPath(url)),
      
      body: contentFile ? contentFile.body : null,
      content: contentData,

      metadata,
      meta
    };

    const template = templateFile.body || templateFile.content;
    const compiled = Handlebars.compile(template);

    route.html = compiled(context);
  }
);