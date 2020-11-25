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

    if (isLayout) {

    } else if (isTemplate) {
      const dataFilesPath = await promisedGlob(resolve(pathData, metadata.collection))
      const dataIoFiles = filesData.filter(({ path }) => dataFilesPath.includes(path))

      // todo: validate metadata collection field

      generatedRoutes
      .push(
        ...dataIoFiles
        .map(dataIoFile => {
          const url = join(folder, slugify(dataIoFile.name))
          const location = new URL(url + '.html', baseUrl);

          return {
            isContent: true,
            url,
            location,
            templateFile: ioFile,
            contentFile: dataIoFile
          }
        })
      );
    } else {
      const url = join(folder, slugify(ioFile.name));

      generatedRoutes.push({
        url,
        location: new URL(url + '.html', baseUrl),
        templateFile: ioFile
      })
    }

    routes.push(...generatedRoutes);
  }
);