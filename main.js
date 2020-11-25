const { resolve, normalize, join, relative, sep, extname, basename, dirname } = require('path');
const { readdir, readFile, writeFile, mkdir } = require('fs').promises;

require('async-extensions');

const { emitHook, registerHook } = require('./src/utils/hooks')
const { promisedGlob } = require("./src/utils/fs")

const { mapDataFile, mapPartialFile, mapViewFile } = require('./src/utils/factory')

require("./src/hooks/fs")
require("./src/hooks/hbs")
require("./src/hooks/md")
require("./src/hooks/yaml")
require("./src/hooks/meta")
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

module.exports = async (config) => {
  const ctx = {
    config,
    files: {
      data: await ([
        ...await promisedGlob(resolve(config.paths.data, '**/*.md')),
        ...await promisedGlob(resolve(config.paths.data, '**/*.yaml'))
      ])
      .mapAsync(path => mapDataFile(config.paths.data, path)),
      partials: await (await promisedGlob(resolve(config.paths.partials, '**/*.hbs')))
      .mapAsync(path => mapPartialFile(config.paths.partials, path)),
      views: await (await promisedGlob(resolve(config.paths.views, '**/*.hbs')))
      .mapAsync(path => mapViewFile(config.paths.views, path))
    },
    routes: [],
    data: {},
    sitemap: []
  }
  
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
  
  await Promise.all(
    ctx.files.views
    .map(async ioFile => {
      await emitHook('routes.generate', ioFile, ctx)
    })
  );
  
  await Promise.all([
      ...ctx.files.data,
      ...ctx.files.partials,
      ...ctx.files.views
    ]
    .map(async ioFile => {
      await emitHook('prepare.metadata', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.data
    .map(async ioFile => {
      await emitHook('prepare.data', ioFile, ctx)
    })
  );
  await Promise.all(
    ctx.files.partials
    .map(async ioFile => {
      await emitHook('prepare.partials', ioFile, ctx)
    })
  );

  await Promise.all(
    ctx.routes
    .map(async route => {
      await emitHook('routes.generate.meta', route, ctx)
    })
  );

  await Promise.all(
    ctx.routes
    .map(async route => {
      await emitHook('routes.render.views', route, ctx)
    })
  );

  await ctx.routes
  .forEachAsync(route => emitHook('routes.finale', route, ctx));

  await emitHook('context.finale', ctx)

  await ctx.routes
  .forEachAsync(route => emitHook('routes.io.persist', route, ctx));

  await emitHook('context.io.persist', ctx)


  console.log('\nconfig -----------------------')
  console.log(config)
};