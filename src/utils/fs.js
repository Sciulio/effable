const { resolve, join, relative, sep, extname, basename, dirname } = require('path');

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
  }
};