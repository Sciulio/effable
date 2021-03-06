const { resolve, normalize, join, relative, sep, extname, basename, dirname } = require('path');
const { readdir, readFile, writeFile, mkdir } = require('fs').promises;

require('async-extensions');

const { emitHook, registerHook } = require('./src/utils/hooks')
const { promisedGlob } = require("./src/utils/fs")

const { mapDataFile, mapPartialFile, mapViewFile } = require('./src/utils/factory')

require("./src/hooks/fs")
require("./src/hooks/lexical/hbs")
require("./src/hooks/lexical/js")
require("./src/hooks/lexical/md")
require("./src/hooks/lexical/yaml")
require("./src/hooks/metadata")
require("./src/hooks/domain/routes")
require("./src/hooks/domain/data")
require("./src/hooks/domain/partials")
require("./src/hooks/assets")
require("./src/hooks/sitemap")
require("./src/hooks/robots")


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
    
    services: {},

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


  const emitHooks = async (list, hook) => list
  .forEachAsync(ioFile =>
    emitHook(hook, ioFile, ctx)
    .catch(err =>
      console.error("ERROR:",
        ioFile.path ||
        ioFile.contentFile && ioFile.contentFile.path ||
        ioFile.templateFile && ioFile.templateFile.path
      ) ||
      console.error(err) ||
      Promise.reject(err)
    )
  );


  await emitHook('modules.init', initialization, ctx);
  
  await emitHooks([
    ...ctx.files.data,
    ...ctx.files.partials,
    ...ctx.files.views
  ], 'file.read.content');
  
  await emitHooks(ctx.files.data, 'file.read.metadata.data');
  await emitHooks(ctx.files.partials, 'file.read.metadata.partials');
  await emitHooks(ctx.files.views, 'file.read.metadata.views');
  
  await emitHooks([
    ...ctx.files.data,
    ...ctx.files.partials,
    ...ctx.files.views
  ], 'files.all.metadata');

  
  await emitHooks(ctx.files.data, 'files.data.prepare');
  await emitHooks(ctx.files.partials, 'files.partials.prepare');

  await emitHooks(ctx.files.data, 'files.data.generate');
  await emitHooks(ctx.files.partials, 'files.partials.generate');

  await emitHooks(ctx.files.data, 'files.data.conclude');
  await emitHooks(ctx.files.partials, 'files.partials.conclude');


  await emitHooks(ctx.files.views, 'routes.generate');

  await emitHooks(ctx.routes, 'routes.generate.metadata');


  await emitHook('routes.conclude', ctx)

  await emitHooks(ctx.routes, 'routes.render.views');

  await emitHooks(ctx.routes, 'routes.finale');

  await emitHook('context.finale', ctx);

  await emitHooks(ctx.routes, 'routes.io.persist');

  await emitHook('context.io.persist', ctx);

  
  console.log('\nSuccess!')
};