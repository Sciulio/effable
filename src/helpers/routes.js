const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { promisedGlob } = require("../utils/fs")


const routesEach = (filter, routesSet, sortBy = null, take = null) => {
  let result = Object.entries(routesSet)
  .map(([_, value]) => value)
  .filter(filter);

  if (sortBy) {
    result = result
    .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);
  }
  if (take) {
    return result.slice(0, take)
  }
  return result;
}

const routesFlat = routes => {
  return Object.entries(routes)
  .map(([ key, value ]) => {
    const result = [
      value
    ];

    if (value && typeof value === 'object') {
      result.push(...routesFlat(value))
    }
    return result;
  })
  .reduce((list, items) => [
    ...list,
    ...items
  ], [])
  .filter(Boolean)
  .filter(({ __isContent }) => typeof __isContent !== 'undefined');
}

const extract = (dataSet, propsList, result = []) => {
  const isArray = Array.isArray(dataSet);
  if (propsList.length === 0) {
    if (isArray) {
      result.push(...dataSet);
    } else {
      result.push(dataSet);
    }
    return result;
  }

  let prop = propsList.shift();
  if (prop === '*') {
    prop = propsList.shift();
    return extract(isArray ? dataSet
      .reduce((res, curr) => [
        ...res,
        ...curr.map(value => prop ? value[prop] : value)
      ], []) : Object.values(dataSet)
      .map(value => prop ? value[prop] : value),
      propsList, result
    );
  }

  if (isArray) {
    return extract(
      prop.split(',').map(p => p.trim()).map(Number).map(pid => dataSet[pid]),
      propsList,
      result
    );
  }
  
  return extract(
    dataSet[prop],
    propsList,
    result
  );
}

module.exports = {
  async fromPath(ctx, filePath) {
    const { files: { data: filesData }, config: { paths: { data: pathData } } } = ctx;

    const dataFilesPath = await promisedGlob(resolve(pathData, filePath))
    return filesData.filter(({ path }) => dataFilesPath.includes(path))
  },
  "routes-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isContent }) => __isContent, ...arguments);
  },
  "data-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isData }) => __isData, ...arguments);
  },
  "routes-flat": routesFlat,
  "data-extract": (dataSet, propsList, removeDuplicates = false) => {
    let result = extract(dataSet, propsList.split('.'));

    if (removeDuplicates) {
      result = result
      .reduce((res, curr) => {
        if (!res.includes(curr)) {
          res.push(curr);
        }
        return res;
      }, [])
    }
    return result;
  }
};