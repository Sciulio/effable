const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { not } = require('../utils/functional')
const { registerHook } = require('../utils/hooks')
const { parseUrl } = require('../utils/urls')

const robotstxt = require("generate-robotstxt");


const robotsEnabled = ({ config: { options: { robots = true } } }) => robots;
const isIndexable = ({ metadata: { robots } }) => !robots || !~robots.indexOf("noindex") && !~robots.indexOf("no-index");

const siteMapFileName = 'sitemap.xml';
const robotsFileName = 'robots.txt';


registerHook(
  'context.finale',
  robotsEnabled,
  async ctx => {
    const { routes, config: { host: { baseUrl } }} = ctx;

    const notIndexableRoutes = routes
    .filter(not(isIndexable))
    .map(route => route.location.pathname);

    const robotsContent = await robotstxt({
      policy: [
        {
          userAgent: "*",
          allow: "/",
          disallow: notIndexableRoutes,
          crawlDelay: 2
        },
      ],
      sitemap: parseUrl(baseUrl, siteMapFileName),
      host: parseUrl(baseUrl)
    })
    
    ctx.bag = Object.assign(ctx.bag || {}, {
      robots: {
        content: robotsContent.toString()
      }
    });
  }
);

registerHook(
  'context.io.persist',
  robotsEnabled,
  async ctx => {
    const { bag: { robots }, config: { paths: { out } } } = ctx;
    
    const robotsFilePath = resolve(join(out, robotsFileName));
    
    await mkdir(dirname(robotsFilePath), { recursive: true });

    await writeFile(robotsFilePath, robots.content);
  }
)