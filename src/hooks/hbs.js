const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { set } = require('lodash');

const { filterByExt } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')
const { pathToProperty } = require('../utils/fs')

let Handlebars = require('handlebars')
require('../helpers/hbs');


registerHook(
  'modules.init',
  async ({ handlebars = handlebars => handlebars }) => {
    Handlebars = handlebars(Handlebars) || Handlebars;
  }
);

const hooksFilter = filterByExt('.hbs');

registerHook(
  'prepare.partials',
  hooksFilter,
  async ({ name, folder, content }) => {
    const fullName = pathToProperty(folder, name); // .replace(/\./g, '_');
    Handlebars.registerPartial(fullName, content)
  }
);

const routeFactory = (url, location, metadata, other = null) => ({
  ...other,
  ...metadata,
  url,
  location
})

registerHook(
  'routes.render.views',
  async (route, { data, routes, config: { host } }) => {
    const { url, location, metadata, meta, contentFile, templateFile, contentData } = route;

    const context = {
      host,

      data,

      route: routeFactory(url, location, metadata, { __isContent: !!contentFile }),
      routes: routes.reduce(( prev, { url, location, metadata, __isContent = false }) => set(
        prev,
        url.replace(/\//g, '.').replace(/\\/g, '.'),
        routeFactory(url, location, metadata, {
          __isContent,
          isCurrent: route.location.href === location.href
        })
      ), {}),
      
      body: contentFile ? contentFile.body : null,
      content: contentData,

      metadata,
      meta
    };

    const compiled = Handlebars.compile(templateFile.body || templateFile.content);
    route.html = compiled(context);
  }
);