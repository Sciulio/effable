const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { set, get } = require('lodash');

const { filterByExt } = require('../../utils/functional')
const { registerHook } = require('../../utils/hooks')
const { pathToProperty, urlToPath } = require('../../utils/fs')

let Handlebars = require('handlebars')
require('../../helpers/hbs');


const hooksFilter = filterByExt('.hbs');

const tinyRouteFactory = ({ url, location, contentData, metadata, __isContent = false, __isBinded = false }) => ({
  ...metadata,
  __isContent,
  __isBinded,
  key: urlToPath(url),
  url,
  location,
  content: contentData
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
  'routes.conclude',
  async ctx => {
    const { routes } = ctx;

    ctx.routesSet = routes
    .map(tinyRouteFactory)
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
    const { url, metadata, metatags, contentFile, templateFile, contentData } = route;

    const context = {
      host,

      data,

      routes: routesSet,
      route: get(routesSet, urlToPath(url)),
      
      body: contentFile ? contentFile.body : null,
      content: contentData,

      metadata,
      metatags
    };

    const source = templateFile.body || templateFile.content;
    const template = Handlebars.compile(source);

    route.html = template(context);
  }
);