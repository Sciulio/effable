const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { set } = require('lodash');

const { emitHook, registerHook } = require('../utils/hooks')
const { pathToProperty } = require('../utils/fs')

const Handlebars = require('handlebars')
const HandlebarsHelpers = require('handlebars-helpers')();


Handlebars.registerHelper('object', function({hash}) {
  //console.log("object-----------------")
  //console.log(hash)
  return hash;
})
Handlebars.registerHelper('array', function() {
  //console.log("array-----------------")
  //console.log(arguments)
  return Array.from(arguments).slice(0, arguments.length-1)
})
/*Handlebars.registerHelper("metadata", function(data) {
  //console.log("metadata---------------------------")
  //console.log(arguments)
  //console.log(data)
  return '';
});*/
Handlebars.registerHelper("entries", function(data) {
  return Object.entries(data);
});
Handlebars.registerHelper("toArray", function(data) {
  return Object.entries(data).map(([_, value]) => value);
});
Handlebars.registerHelper("cycleRoutes", function(data, sortBy) {
  return Object.entries(data)
  .map(([_, value]) => value)
  .filter(({ isContent }) => isContent)
  .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
});

const hooksFilter = ({ ext }) => ext === '.hbs';

registerHook(
  'prepare.partials',
  hooksFilter,
  async ({ name, folder, content }) => {
    const fullName = pathToProperty(folder, name); // .replace(/\./g, '_');
    Handlebars.registerPartial(fullName, content)
  }
);

registerHook(
  'routes.render.views',
  async (route, { data, routes, config: { host } }) => {
    const { url, location, metadata, meta, contentFile, templateFile } = route;

    const context = {
      data,
      metadata,
      meta,
      //body: contentFile ? contentFile.body || contentFile.content : null,
      body: contentFile ? contentFile.body : null,
      route: {
        ...metadata,
        url,
        location,
        isContent: !!contentFile
      },
      routes: routes.reduce((prev, { url, location, metadata, isContent = false }) => set(
        prev,
        url.replace(/\//g, '.').replace(/\\/g, '.'), {
          ...metadata,
          isContent,
          url,
          location
        }), {}
      ),
      host
    };

    const compiled = Handlebars.compile(templateFile.body || templateFile.content);
    route.html = compiled(context);
  }
);