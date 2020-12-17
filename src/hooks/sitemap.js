const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { and, carry, higher } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')

const { SitemapStream, streamToPromise } = require( 'sitemap' )
const { Readable } = require( 'stream' )


const siteMapEnabled = ({ config: { options: { siteMap = true } } }) => siteMap;
const isIndexable = ({ metadata: { robots } }) => !robots || robots.indexOf("noindex") < 0 && robots.indexOf("no-index") < 0;
const convertIoTimestamp = tsMs => tsMs; // new Date(tsMs).toString("yyyy-MM-dd").split("T")[0];

registerHook(
  'routes.finale',
  and(carry(siteMapEnabled), isIndexable),
  async route => {
    const {
      url,
      templateFile,
      contentFile,
      metadata: {
        changefreq = 'monthly',
        priority = 0.8,
        lastmod = convertIoTimestamp(higher(templateFile.editedOn, contentFile && contentFile.editedOn))
      }
    } = route;

    //todo: https://www.npmjs.com/package/sitemap

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
  siteMapEnabled,
  async ctx => {
    const { routes, config: { host: { baseUrl } }} = ctx;

    console.log('siteMap --------------------')

    // generate sitemap
    const routeMaps = routes
    .filter(route => route.routeMap)
    .map(route => route.routeMap);

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
  siteMapEnabled,
  async ctx => {
    const { siteMap, config: { paths: { out } } } = ctx;
    
    const outFilePath = resolve(join(out, 'sitemap.xml'));
    
    await mkdir(dirname(outFilePath), { recursive: true });
    await writeFile(outFilePath, siteMap.content);
  }
)