const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { get, set } = require('lodash')

const { filterByExt } = require('../../utils/functional')
const { registerHook } = require('../../utils/hooks')

const MarkdownIt = require('markdown-it');


let md; // = new MarkdownIt();

const hooksFilter = filterByExt('.md');

registerHook(
  'modules.init',
  async ({ 'markdown-it': markdown_it = mit => new mit() }) => {
    md = markdown_it(MarkdownIt);
  }
);

registerHook(
  'files.data.generate',
  hooksFilter,
  async (ioFile, { config: { paths: { data: pathData } }, data }) => {
    const { prop, metadata } = ioFile;
    let { body } = ioFile;

    body = md.render(body);
    
    ioFile.body = body;

    if (get(data, prop)) {
      throw 'Multiple data with same name (different extension)!'
    }
    set(data, prop, {
      ...metadata,
      key: prop,
      body,
      __isData: true,
      __source: ioFile
    });
  }
);