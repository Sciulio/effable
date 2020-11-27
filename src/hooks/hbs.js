const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { set } = require('lodash');

const { emitHook, registerHook } = require('../utils/hooks')
const { pathToProperty } = require('../utils/fs')

const Handlebars = require('handlebars')
const HandlebarsHelpers = require('handlebars-helpers')();
require('../helpers/hbs');


const hooksFilter = ({ ext }) => ext === '.hbs';

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
    const { url, location, metadata, meta, contentFile, templateFile } = route;

    const context = {
      data,
      metadata,
      meta,
      body: contentFile ? contentFile.body : null,
      route: routeFactory(url, location, metadata, { isContent: !!contentFile }),
      routes: routes.reduce(( prev, { url, location, metadata, isContent = false }) => set(
        prev,
        url.replace(/\//g, '.').replace(/\\/g, '.'),
        routeFactory(url, location, metadata, {
          isContent,
          isCurrent: route.location.href === location.href
        })
      ), {}),
      host
    };

    const compiled = Handlebars.compile(templateFile.body || templateFile.content);
    route.html = compiled(context);
  }
);