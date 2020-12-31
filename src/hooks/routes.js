const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { URL } = require('url');

const { get } = require('lodash');
const slugify = require('slugify');

const { emitHook, registerHook } = require('../utils/hooks')
const { assertNotNullishString } = require('../utils/asserts');
const routesHelper = require("../helpers/routes")
const { fromPath, "data-extract" : dataExtract } = routesHelper;


registerHook(
  'routes.generate',
  async (ioFile, ctx) => {
    const { files: { data: filesData }, routes, data, config: { paths: { views: pathViews, data: pathData }, host: { baseUrl }} } = ctx;
    const { name, folder, isIndex, isLayout, isTemplate, metadata } = ioFile;
    let generatedRoutes = []

    const generateRoute = (fileFolder, fileName, other) => {
      const url = join(fileFolder, slugify(fileName)) + '.html';
      const location = new URL(url, baseUrl);

      return {
        url,
        location,
        templateFile: ioFile,
        ...other
      }
    }
    const isNotDuplicated = ({ url }) => !routes.some(route => route.url === url)
    const flatObject = (obj, times, result = []) => {
      if (times > 0) {
        (Array.isArray(obj) ? obj : Object.values(obj))
        .map(child => flatObject(child, times - 1, result))
      } else {
        result.push(obj)
      }
      return result;
    };

    if (isLayout) {

    } else if (isTemplate) {
      const { collection } = metadata;
      let dataIoFiles;

      if (typeof collection === 'object') {
        const {
          source,
          path = '',
          prop = ''
        } = collection;
        
        assertNotNullishString(
          source,
          `"collection.source" metadata parameter inside "${ioFile.path}" should be a path through data object properties. "*" is allowed (ex. "posts.*.tags.*")!`
        )

        const itemsList = dataExtract(data, source, true);

        generatedRoutes
        .push(
          ...itemsList
          .map(contentData => {
            const fileName = prop ? get(contentData, prop) : contentData;
            return generateRoute(folder + '/' + name.substring(1), fileName, {
              __isBinded: true,
              contentData: path ? get(contentData, path) : contentData
            })
          })
        );
      } else {
        assertNotNullishString(
          collection,
          `"collection" metadata parameter inside "${ioFile.path}" should be a valid glob path inside "data" folder!`
        );

        dataIoFiles = await fromPath(ctx, collection);
        
        generatedRoutes
        .push(
          ...dataIoFiles
          .map(contentFile => generateRoute(folder, contentFile.name, {
            __isContent: true,
            contentFile
          }))
        );
      }

      // todo: validate metadata collection field
    } else {
      generatedRoutes.push(generateRoute(folder, ioFile.name));
    }

    routes.push(
      ...generatedRoutes
      .filter(isNotDuplicated)
    );
  }
);