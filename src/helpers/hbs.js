const Handlebars = require('handlebars')

const { parse } = require("url");
const { get } = require('lodash');

const routesHelper = require('./routes');
const { generateHtmlMetatags } = require('./metatags');


// https://stackoverflow.com/a/37511463
const normalizeWord = word => word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const getVarArgs = (args) => [...args].splice(0, args.length - 1)
const getContext = (args) => args[args.length - 1]
const getRootData = (args) => getContext(args).data._parent.root


//todo: add handlebars registerHelper invocations inside handlebars initialization hook
//todo: add implementation to ./routes.js


Handlebars.registerHelper('object', function({ hash }) {
  //console.log("object-----------------")
  //console.log(hash)
  return hash;
})
Handlebars.registerHelper('array', function() {
  //console.log("array-----------------")
  //console.log(arguments)
  return getVarArgs(arguments); // Array.from(arguments).slice(0, arguments.length-1)
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

Handlebars.registerHelper('route-isCurrent', function(activeClasses, relUrl) {
  const { route: { location }, host: { baseUrl } } = getRootData(arguments); // this;

  const url = new URL(relUrl, baseUrl);
  const isCurrent = url.href == location.href;
  
  if (typeof activeClasses === 'string') {
    return isCurrent ? activeClasses : '';
  }
  return isCurrent;
});
Handlebars.registerHelper('route-isRelative', function(activeClasses, ...relUrls) {
  const { route: { location }, host: { baseUrl } } = getRootData(arguments);

  return relUrls
  .splice(0, relUrls.length - 1)
  .some(relUrl => {
    const url = new URL(relUrl, baseUrl);
    return location.href.indexOf(url.href) === 0;
  }) ? activeClasses : '';
});
Handlebars.registerHelper('route-a', function() {
  const { route: { location }, host: { baseUrl } } = getRootData(arguments);
  let [ relUrl, title, activeClasses = '', additionalClasses = '', attrs = '' ] = getVarArgs(arguments); // [...arguments].splice(0, arguments.length - 1)

  if (relUrl.indexOf(baseUrl) === 0) {
    relUrl = relUrl.replace(baseUrl, '');
  }

  const url = new URL(relUrl, baseUrl);
  const isCurrent = url.href == location.href;

  return new Handlebars.SafeString(`
    <a
      class="${additionalClasses} ${isCurrent ? activeClasses : ''}"
      href="${url.href}" ${attrs}>${title}</a>
  `);
});

Handlebars.registerHelper('route-urlify', function() {
  const { host: { baseUrl } } = getRootData(arguments)
  const urlParts = getVarArgs(arguments)

  const url = parse(urlParts.map(normalizeWord).join('/')).href + '.html';
  return new URL(url, baseUrl);
});
Handlebars.registerHelper('asset-urlify', function() {
  const { host: { resxUrl } } = getRootData(arguments);
  const urlParts = getVarArgs(arguments)
  
  const url = parse(urlParts.map(normalizeWord).join('/')).href;
  return new URL(url, resxUrl);
});

Handlebars.registerHelper("routes-each", function() {
  return routesHelper['routes-each'](...getVarArgs(arguments));
});

Handlebars.registerHelper("routes-binded-each", function() {
  return routesHelper['routes-binded-each'](...getVarArgs(arguments));
});

Handlebars.registerHelper("data-each", function() {
  return routesHelper['data-each'](...getVarArgs(arguments));
});

Handlebars.registerHelper('routes-flat', routesHelper['routes-flat']);

const extract = (data, property, compareProperty = null, isMany = false) => {
  let result = Array.isArray(data) ? data : Object.entries(data)
  .map(([_, value]) => value);

  result = result
  .map(item => get(item, property));

  if (isMany) {
    result = result
    .reduce((resList, valueList) => [ // many
      ...resList,
      ...valueList
    ], []);
  }

  if (compareProperty) {
    result = result
    .reduce((_list, value) => [
      ..._list,
      (_list.some(v => get(v, compareProperty) === get(value, compareProperty)) ? null : value)
    ], [])
  } else {
    result = result
    .reduce((_list, value) => [
      ..._list,
      (_list.some(v => v === value) ? null : value)
    ], [])
  }

  return result
  .filter(Boolean);
}

// todo: reqrite method declaration as: route-parent(toRoot: boolean)
Handlebars.registerHelper('routes-parent-root', function() {
  console.log(getRootData(arguments))
  const { routes, route: route_ } = getRootData(arguments)
  const { url } = getVarArgs(arguments)[0] || route_;

  const paths = url.split('/');
  const lastPart = paths.pop();
  const rootPath = paths[0];
  const flattenedRoutes = routesHelper['routes-flat'](routes);

  return flattenedRoutes
  .find(({ url }) => url == rootPath || lastPart)
})

Handlebars.registerHelper('extract', function() {
  return extract(...getVarArgs(arguments));
})

Handlebars.registerHelper('extract-many', function() {
  const { data } = getRootData(arguments)
  return routesHelper["data-extract"](data, ...getVarArgs(arguments))
  //return extract(...getVarArgs(arguments), true);
})

// helpers:


Handlebars.registerHelper('html-metatags', function() {
  const { route, metadata } = getRootData(arguments)
  const [ fullList = true ] = getVarArgs(arguments)

  return new Handlebars.SafeString(
    generateHtmlMetatags(route, metadata, fullList)
    .join('\n')
  );
})