const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { copy } = require('fs-extra')

const { emitHook, registerHook } = require('../utils/hooks')


registerHook(
  'context.io.persist',
  async ({ config: { paths: { assets, out } }}) => {
    await copy(resolve(assets), resolve(out));
  }
);