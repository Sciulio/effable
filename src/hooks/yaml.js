const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { set, get, merge } = require('lodash')
const { emitHook, registerHook } = require('../utils/hooks')
const { pathToProperty } = require('../utils/fs')


const hooksFilter = ({ ext }) => ext === '.yaml';

registerHook(
  'prepare.data',
  hooksFilter,
  async (ioFile, { data }) => {
    const { name, folder, body, metadata } = ioFile;
    const path = pathToProperty(folder, name);

    if (get(data, path)) {
      throw 'Multiple data with same name (different extension)!'
    }
    set(data, path, { ...metadata, __isData: true });
  }
);