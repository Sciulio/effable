const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { get, set } = require('lodash')
const { emitHook, registerHook } = require('../utils/hooks')
const { pathToProperty } = require('../utils/fs')

const MarkdownIt = require('markdown-it');


const md = new MarkdownIt();

const hooksFilter = ({ ext }) => ext === '.md';

registerHook(
  'prepare.data',
  hooksFilter,
  async (ioFile, { config: { paths: { data: pathData } }, data }) => {
    const { name, folder } = ioFile;
    let { body, metadata } = ioFile;
    const path = pathToProperty(folder, name);

    body = md.render(body);
    
    ioFile.body = body;

    if (get(data, path)) {
      throw 'Multiple data with same name (different extension)!'
    }
    set(data, path, { ...metadata, body });
  }
);