const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { emitHook, registerHook } = require('../utils/hooks')
const { promisedGlob } = require("../utils/fs")

const { SitemapStream, streamToPromise } = require( 'sitemap' )
const { Readable } = require( 'stream' )

const slugify = require('slugify')


const takeHigher = (...tsList) => tsList
.filter(Boolean)
.sort()[0]
const convertIoTimestamp = tsMs => tsMs; // new Date(tsMs).toString("yyyy-MM-dd").split("T")[0];

registerHook(
  'routes.finale',
  async (route, { files: { data }, routes, config: { paths: { views: pathViews, data: pathData }} }) => {
    const {
      url,
      templateFile,
      contentFile
    } = route;

    //todo: https://www.npmjs.com/package/sitemap
    const {
      metadata: {
        changefreq = 'monthly',
        priority = 0.8,
        lastmod = convertIoTimestamp(takeHigher(templateFile.editedOn, contentFile && contentFile.editedOn))
      }
    } = route;

    route.routeMap = {
      url,
      //todo: loc: domain + url
      changefreq, // monthly, weekly, daily
      priority,
      lastmod // todo => to 2012-01-23
      // img
    }
  }
);

registerHook(
  'context.finale',
  async ctx => {
    const { routes, config: { host: { baseUrl } }} = ctx;

    console.log('siteMap --------------------')

    // generate sitemap
    const routeMaps = routes.map(r => r.routeMap);

    // Create a stream to write to
    const stream = new SitemapStream({ hostname: baseUrl })
    const dataBuffer = await streamToPromise(Readable.from(routeMaps).pipe(stream))
    
    ctx.siteMap = {
      routes: routeMaps,
      content: dataBuffer.toString()
    };
  }
)

registerHook(
  'context.io.persist',
  async ctx => {
    const { siteMap, config: { paths: { out } } } = ctx;
    
    const outFilePath = resolve(join(out, 'siteMap.xml'));
    
    await mkdir(dirname(outFilePath), { recursive: true });
    await writeFile(outFilePath, siteMap.content);
  }
)