const { resolve, join, relative, sep, extname, basename, dirname, parse } = require('path');

const glob = require("glob")


module.exports = {
  promisedGlob(pattern, options = undefined) {
    return new Promise((res, rej) => {
      glob(pattern, options, (err, matches) => {
        err ? rej(err) : res(matches)
      });
    })
  },
  pathToProperty(...pathList) {
    return join(...pathList).replace(/[\\/]/g, '.');
  },
  //urlToPath: url => parse(url).name.replace(/\//g, '.').replace(/\\/g, '.')
  urlToPath: url => url
  .replace(new RegExp(extname(url) + '$', 'i'), '')
  .replace(/\//g, '.')
  .replace(/\\/g, '.')
};