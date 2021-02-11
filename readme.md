## Info

Simple static site generator with support for:
- handlebars (with handlebars-helpers)
- markdown
- yaml
- seo
- sitemaps
- templating, partials, layout
- metadata

will support (hopefully shortly) (TODO)
- minify
- scss builder


## Installation

```
npm install @sciulio/effable --save-dev
```
or maybe

```
yarn add @sciulio/effable
```

then import main.js then run as async func with site config:

ex.

```js
{
  paths: {
    assets: '<path to assets>',
    data: '<path to data>',
    partials: '<path to partials>',
    views: '<path to views>',
    out: '<output path>'
  },
  host: {
    baseUrl: '<base url>',
    resxUrl: '<base url for resources>'
  }
}
```

### todo
add modules as plugin
ex: https://medium.com/@claudio_69833/how-i-compressed-images-with-jimp-and-imagemin-with-node-js-ff863a4c46ac