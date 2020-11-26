const Handlebars = require('handlebars')


Handlebars.registerHelper('object', function({ hash }) {
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

Handlebars.registerHelper('route-isCurrent', function(activeClasses, relUrl) {
  const { route: { location }, host: { baseUrl } } = this;

  const url = new URL(relUrl, baseUrl);
  const isCurrent = url.href == location.href;
  
  if (typeof activeClasses === 'string') {
    return isCurrent ? activeClasses : '';
  }
  return isCurrent;
});
Handlebars.registerHelper('route-isRelative', function(activeClasses, ...relUrls) {
  const { route: { location }, host: { baseUrl } } = this;

  return relUrls
  .splice(0, relUrls.length - 1)
  .some(relUrl => {
    const url = new URL(relUrl, baseUrl);
    return location.href.indexOf(url.href) === 0;
  }) ? activeClasses : '';
});
Handlebars.registerHelper('route-a', function() {
  const { route: { location }, host: { baseUrl } } = this;
  const [ relUrl, title, activeClasses = '', additionalClasses = '', attrs = '' ] = [...arguments].splice(0, arguments.length - 1)

  const url = new URL(relUrl, baseUrl);
  const isCurrent = url.href == location.href;

  return new Handlebars.SafeString(`
    <a
      class="${additionalClasses} ${isCurrent ? activeClasses : ''}"
      href="${url.href}" ${attrs}>${title}</a>
  `);
});

Handlebars.registerHelper("routes-each", function(data, sortBy) {
  return Object.entries(data)
  .map(([_, value]) => value)
  .filter(({ isContent }) => isContent)
  .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
});