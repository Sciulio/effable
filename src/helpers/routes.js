const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { get } = require('lodash');
const { promisedGlob } = require("../utils/fs");
const { assertAssigned, assertNotNullishString } = require('../utils/asserts');


/*
  [note:0]
  v8's sort algorithm seems to be unstable, so we exclude sorting by undefined values
  info at:
  https://bugs.chromium.org/p/v8/issues/detail?id=90
*/

//todo: make a folder


const sorter = sortBy => (a, b) => {
  const sortA = get(a, sortBy);
  const sortB = get(b, sortBy);
  return (isNaN(sortA) ? sortA : parseFloat(sortA)) > (isNaN(sortB) ? sortB : parseFloat(sortB)) ? 1 : -1;
}

const routesEach = (filter, routesSet, sortBy = null, take = null) => {
  assertAssigned(
    routesSet,
    "RouteSet can not be null!"
  );
  
  let result = Object.entries(routesSet)
  .map(([_, value]) => value)
  .filter(filter);

  if (sortBy) {
    result = result
    .filter(item => typeof get(item, sortBy) !== 'undefined') // [note:0]
    .sort(sorter(sortBy));
  }
  if (take) {
    return result.slice(0, take)
  }
  return result;
}

const routesFlat = (routes, sortBy = null) => {
  const result = Object.entries(routes)
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

  if (sortBy) {
    return result
    .filter(item => typeof get(item, sortBy) !== 'undefined') // [note:0]
    .sort(sorter(sortBy));
  }

  return result;
}

const extract = (dataSet, propsList, result = []) => {
  assertAssigned(
    dataSet,
    "DataSet to extract must not be null!"
  )

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
      .reduce((res, dataItem) => [
        ...res,
        ...dataItem.map(value => prop ? value[prop] : value)
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

const extractPaths = (dataSet, propsList, results = [], cpath = []) => {
  if (!propsList.length) {
    results.push(cpath);
    return results;
  }

  let prop = propsList.shift();

  if (prop == '*') {
    if (Array.isArray(dataSet)) {
      dataSet
      .forEach((val, idx) => extractPaths(val, [...propsList], results, [...cpath, idx.toString()]))
    } else {
      Object.entries(dataSet)
      .forEach(([key, val]) => extractPaths(val, [...propsList], results, [...cpath, key]))
    }
    return results;
  //} else if (match = prop.match(/^\[(\d+)\]/)) {
  }

  cpath.push(prop);

  return extractPaths(dataSet[prop], propsList, results, cpath);
}

module.exports = {
  async fromPath(ctx, filePath) {
    assertNotNullishString(
      filePath,
      '"FilePath" should be a valid glob path inside "data" folder!'
    );

    const { files: { data: filesData }, config: { paths: { data: pathData } } } = ctx;

    const dataFilesPath = await promisedGlob(resolve(pathData, filePath))
    return filesData.filter(({ path }) => dataFilesPath.includes(path))
  },
  "routes-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isContent }) => typeof __isContent !== 'undefined', ...arguments);
  },
  "routes-binded-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isBinded }) => __isBinded, ...arguments);
  },
  "data-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isData }) => __isData, ...arguments);
  },
  "routes-flat": routesFlat,
  "route-parent": ({ key, url }, { routes }, toRoot) => {
    const paths = url.split('/');
    const lastPart = paths.pop();
    const rootPath = paths[0];

    return routesFlat(routes)
    .find(({ url }) => url == rootPath || lastPart);
  },
  "data-extract": (dataSet, propPath, removeDuplicates = false) => {
    assertAssigned(
      dataSet,
      'DataSet param can not bu null!'
    );
    assertNotNullishString(
      propPath,
      'PropPath must be a path through data object properties ("*" allowed, ex. "posts.*.tags.*")!'
    )

    let result = extract(dataSet, propPath.split('.'));

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
  },
  "data-extract_info": (dataSet, propPath, removeDuplicates = false) => {
    assertAssigned(
      dataSet,
      'DataSet param can not bu null!'
    );
    assertNotNullishString(
      propPath,
      'PropPath must be a path through data object properties ("*" allowed, ex. "posts.*.tags.*")!'
    )
    
    return extractPaths(dataSet, propPath.split('.'))
    .map(extractedPath => {
      let ep = [...extractedPath];
      let data;
      while((data = get(dataSet, ep)) && (typeof data !== 'object' || !('__source' in data))) {
        ep.splice(-1, 1)
      }
      return [
        extractedPath,
        get(dataSet, extractedPath),
        data.__source
      ]
    })
  }
};