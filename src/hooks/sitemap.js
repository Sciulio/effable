const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { Readable } = require('stream');

const { and, carry, higher } = require('../utils/bfunctional')
const { registerHook } = require('../utils/hooks')

const { SitemapStream, streamToPromise } = require('sitemap')


const siteMapEnabled = ({ config: { options: { siteMap = true } } }) => siteMap;
const isIndexable = ({ metadata: { robots } }) => !robots || !~robots.indexOf("noindex") && !~robots.indexOf("no-index");

const convertIoTimestamp = tsMs => tsMs; // new Date(tsMs).toString("yyyy-MM-dd").split("T")[0];

const siteMapFileName = 'sitemap.xml';


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

    route.bag = Object.assign(route.bag || {}, {
      siteMapInfo: {
        url,
        //todo: loc: domain + url
        changefreq, // monthly, weekly, daily
        priority,
        lastmod // todo => to 2012-01-23
        // img
      }
    });
  }
);

registerHook(
  'context.finale',
  siteMapEnabled,
  async ctx => {
    const { routes, config: { host: { baseUrl } }} = ctx;

    // generate sitemap
    const routeMaps = routes
    .filter(route => route.bag && route.bag.siteMapInfo)
    .map(route => route.bag.siteMapInfo);

    // Create a stream to write to
    const siteMapDataBuffer = await streamToPromise(
      Readable
      .from(routeMaps)
      .pipe(new SitemapStream({ hostname: baseUrl }))
    );
    
    ctx.bag = Object.assign(ctx.bag || {}, {
      siteMap: {
        routes: routeMaps,
        content: siteMapDataBuffer.toString()
      }
    });
  }
);

registerHook(
  'context.io.persist',
  siteMapEnabled,
  async ctx => {
    const { bag: { siteMap }, config: { paths: { out } } } = ctx;
    
    const siteMapFilePath = resolve(join(out, siteMapFileName));
    
    await mkdir(dirname(siteMapFilePath), { recursive: true });

    await writeFile(siteMapFilePath, siteMap.content);
  }
)