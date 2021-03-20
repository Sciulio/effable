const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { get, set } = require('lodash')

const { filterByExt } = require('../utils/functional')
const { registerHook } = require('../utils/hooks')

const MarkdownIt = require('markdown-it');


registerHook(
  'modules.init',
  async ({ 'markdown-it': markdown_it = mit => new mit() }, { services }) => {
    services['md'] = markdown_it(MarkdownIt);
  }
);

registerHook(
  'files.data.generate',
  filterByExt('.md'),
  async (ioFile, { config: { paths: { data: pathData } }, data, services: { md } }) => {
    const { prop, metadata } = ioFile;
    let { body } = ioFile;

    body = md.render(body);
    
    ioFile.body = body;

    if (get(data, prop)) {
      throw 'Multiple data with same name (different extension)!'
    }
    set(data, prop, { ...metadata, body, __isData: true, __source: ioFile });
  }
);