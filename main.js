const { resolve, normalize, join, relative, sep, extname, basename, dirname } = require('path');
const { readdir, readFile, writeFile, mkdir } = require('fs').promises;

require('async-extensions');

const { emitHook, registerHook } = require('./src/utils/hooks')
const { promisedGlob } = require("./src/utils/fs")

const { mapDataFile, mapPartialFile, mapViewFile } = require('./src/utils/factory')

require("./src/hooks/fs")
require("./src/hooks/hbs")
require("./src/hooks/js")
require("./src/hooks/md")
require("./src/hooks/yaml")
require("./src/hooks/metadata")
require("./src/hooks/routes")
require("./src/hooks/sitemap")
require("./src/hooks/assets")


const rootPath = dirname(require.main.filename || process.mainModule.filename);


/*
config arg ex.

{
  paths: {
    assets: './site/assets',
    data: './site/data',
    partials: './site/partials',
    views: './site/views',
    out: './out'
  },
  host: {
    baseUrl: 'http://127.0.0.1:5501/out/',
    resxUrl: 'http://127.0.0.1:5501/out/'
  }
}
*/

// TODO: add config for defaults for seo and others
module.exports = async ({
  paths,
  host,
  options,
  helpers
}, initialization) => {
  const config = {
    paths,
    host,
    options,
    helpers
  };

  console.log("Configuration:")
  console.log(config)

  const ctx = {
    config,
    files: {
      data: await ([
        ...await promisedGlob(resolve(paths.data, '**/*.md')),
        ...await promisedGlob(resolve(paths.data, '**/*.yaml')),
        ...await promisedGlob(resolve(paths.data, '**/*.js'))
      ])
      .mapAsync(path => mapDataFile(paths.data, path)),
      partials: await (await promisedGlob(resolve(paths.partials, '**/*.hbs')))
      .mapAsync(path => mapPartialFile(paths.partials, path)),
      views: await (await promisedGlob(resolve(paths.views, '**/*.hbs')))
      .mapAsync(path => mapViewFile(paths.views, path))
    },
    routes: [],
    data: {},
    sitemap: []
  }

  
  await emitHook('modules.init', initialization, ctx);
  
  await Promise.all([
      ...ctx.files.data,
      ...ctx.files.partials,
      ...ctx.files.views
    ]
    .map(async ioFile => {
      await emitHook('file.read.content', ioFile, ctx)
    })
  );
  
  await Promise.all(
    ctx.files.data
    .map(async ioFile => {
      await emitHook('file.read.metadata.data', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.partials
    .map(async ioFile => {
      await emitHook('file.read.metadata.partials', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.views
    .map(async ioFile => {
      await emitHook('file.read.metadata.views', ioFile, ctx)
    })
  );
  
  await Promise.all([
      ...ctx.files.data,
      ...ctx.files.partials,
      ...ctx.files.views
    ]
    .map(async ioFile => {
      await emitHook('files.all.metadata', ioFile, ctx)
    })
  );

  await Promise.all(
    ctx.files.data
    .map(async ioFile => {
      await emitHook('files.data.prepare', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.partials
    .map(async ioFile => {
      await emitHook('files.partials.prepare', ioFile, ctx)
    })
  );

  await Promise.all(
    ctx.files.data
    .map(async ioFile => {
      await emitHook('files.data.generate', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.partials
    .map(async ioFile => {
      await emitHook('files.partials.generate', ioFile, ctx)
    })
  );
  
  await Promise.all(
    ctx.files.views
    .map(async ioFile => {
      await emitHook('routes.generate', ioFile, ctx)
    })
  );

  await Promise.all(
    ctx.routes
    .map(async route => {
      await emitHook('routes.generate.metadata', route, ctx)
    })
  );


  await emitHook('routes.prologo', ctx)

  await Promise.all(
    ctx.routes
    .map(async route => {
      await emitHook('routes.render.views', route, ctx)
    })
  );

  await ctx.routes
  .forEachAsync(route => emitHook('routes.finale', route, ctx));

  await emitHook('context.finale', ctx);

  await ctx.routes
  .forEachAsync(route => emitHook('routes.io.persist', route, ctx));

  await emitHook('context.io.persist', ctx);

  
  console.log('\nSuccess!')
};