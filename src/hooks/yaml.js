const { set, get } = require('lodash')

const { filterByExt } = require('../utils/functional')
const { registerHook } = require('../utils/hooks')


const hooksFilter = filterByExt('.yaml');

registerHook(
  'files.data.generate',
  hooksFilter,
  async (ioFile, { data }) => {
    const { prop, metadata } = ioFile;

    if (get(data, prop)) {
      throw 'Multiple data with same name (different extension)!'
    }
    set(data, prop, { ...metadata, __isData: true });
  }
);