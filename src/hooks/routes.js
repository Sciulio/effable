const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');
const { URL } = require('url');

const { emitHook, registerHook } = require('../utils/hooks')
const { promisedGlob } = require("../utils/fs")

const slugify = require('slugify')


registerHook(
  'routes.generate',
  async (ioFile, { files: { data: filesData }, routes, config: { paths: { views: pathViews, data: pathData }, host: { baseUrl }} }) => {
    const { name, folder, isIndex, isLayout, isTemplate, metadata } = ioFile;
    let generatedRoutes = []

    const generateRoute = (fileFolder, fileName, other) => {
      const url = join(fileFolder, slugify(fileName))
      const location = new URL(url + '.html', baseUrl);

      return {
        url,
        location,
        templateFile: ioFile,
        ...other
      }
    }

    if (isLayout) {

    } else if (isTemplate) {
      const dataFilesPath = await promisedGlob(resolve(pathData, metadata.collection))
      const dataIoFiles = filesData.filter(({ path }) => dataFilesPath.includes(path))

      // todo: validate metadata collection field

      generatedRoutes
      .push(
        ...dataIoFiles
        .map(dataIoFile => generateRoute(folder, dataIoFile.name, {
          isContent: true,
          contentFile: dataIoFile
        }))
      );
    } else {
      const url = join(folder, slugify(ioFile.name));
      
      generatedRoutes.push(generateRoute(folder, ioFile.name));
    }

    routes.push(...generatedRoutes);
  }
);