const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { get, set } = require('lodash')

const { filterByExt } = require('../utils/functional')
const { registerHook } = require('../utils/hooks')


const hooksFilter = filterByExt('.js');

registerHook(
  'files.data.generate',
  hooksFilter,
  async (ioFile, { config: { paths: { data: pathData } }, data }) => {
    const { prop, path, metadata } = ioFile;
    let { body } = ioFile;

    const module = require(path);

    body = await (Promise.resolve(module())
    .catch(err => {
      console.error('----------------')
      console.error(err)
    }));

    if (get(data, prop)) {
      throw 'Multiple data with same name (different extension)!'
    }
    //set(data, prop, { ...metadata, body, __isData: true });
    set(data, prop, { ...body, __isData: true, __source: ioFile });
  }
);