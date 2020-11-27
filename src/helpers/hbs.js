const Handlebars = require('handlebars')

const { parse } = require("url");
const { get } = require('lodash');


// https://stackoverflow.com/a/37511463
const normalizeWord = word => word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const getVarArgs = (args) => [...args].splice(0, args.length - 1)
const getRootData = (args) => args[args.length - 1].data._parent.root

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
  const { route: { location }, host: { baseUrl } } = getRootData(arguments); // this;

  return relUrls
  .splice(0, relUrls.length - 1)
  .some(relUrl => {
    const url = new URL(relUrl, baseUrl);
    return location.href.indexOf(url.href) === 0;
  }) ? activeClasses : '';
});
Handlebars.registerHelper('route-a', function() {
  const { route: { location }, host: { baseUrl } } = getRootData(arguments); // this;
  const [ relUrl, title, activeClasses = '', additionalClasses = '', attrs = '' ] = getVarArgs(arguments); // [...arguments].splice(0, arguments.length - 1)

  const url = new URL(relUrl, baseUrl);
  const isCurrent = url.href == location.href;

  return new Handlebars.SafeString(`
    <a
      class="${additionalClasses} ${isCurrent ? activeClasses : ''}"
      href="${url.href}" ${attrs}>${title}</a>
  `);
});

Handlebars.registerHelper("routes-each", function() {
  const [ routesSet, sortBy = null, take = null ] = getVarArgs(arguments);

  let result = Object.entries(routesSet)
  .map(([_, value]) => value)
  .filter(({ isContent }) => isContent);

  if (sortBy) {
    result = result
    .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
  }
  if (take) {
    return result.slice(0, take)
  }
  return result;
});

Handlebars.registerHelper('urlify-route', function() {
  const { host: { baseUrl } } = getRootData(arguments)
  const urlParts = getVarArgs(arguments)
  const url = parse(urlParts.map(normalizeWord).join('/')).href + '.html';
  return new URL(url, baseUrl);
})

/*Handlebars.registerHelper('urlify-resx', function() {
  const { host: { resxUrl } } = getRootData(arguments);
  const urlParts = getVarArgs(arguments)
  const url = parse(urlParts.map(normalizeWord).join('/')).href;
  return new URL(url, resxUrl);
})*/

const extract = ([ data, property, compareProperty = null], isMany = false) => {
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

Handlebars.registerHelper('extract', function() {
  return extract(getVarArgs(arguments));
})

Handlebars.registerHelper('extract-many', function() {
  return extract(getVarArgs(arguments), true);
})