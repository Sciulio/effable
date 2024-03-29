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

const isRoute = ({ __isContent }) => typeof __isContent !== 'undefined';
const isContent = ({ __isContent }) => __isContent;
const isBinded = ({ __isBinded }) => __isBinded;
const isData = ({ __isData }) => __isData;

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
  .filter(isRoute);

  if (sortBy) {
    return result
    .filter(item => typeof get(item, sortBy) !== 'undefined') // [note:0]
    .sort(sorter(sortBy));
  }

  return result;
}

const extractDeep = (data, props, flatten, result = []) => {
  if (typeof data === 'undefined') {
    return result;
  }

  if (!props.length) {
    result.push(data);

    return result;
  }

  const prop = props.shift();

  if (prop === '*') {
    let cResult = result;

    if (!flatten) {
      cResult = [];
      result.push(cResult);
    }
    
    Object.values(data)
    .forEach(value => {
      extractDeep(value, [...props], flatten, cResult);
    });

    return result;
  }

  return extractDeep(data[prop], props, flatten, result);
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
  "route-parent": ({ key, url }, { routes }, toRoot) => {
    // todo: implement toRoot
    // todo: match removing only '.html' extension to url
    const paths = url.split('/');
    const lastPart = paths.pop();
    const rootPath = paths[0];

    return routesFlat(routes)
    .find(({ url }) => url == rootPath || lastPart);
  },
  "routes-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(isRoute, ...arguments);
  },
  "routes-binded-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(isBinded, ...arguments);
  },
  "data-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(isData, ...arguments);
  },
  "routes-flat": routesFlat,
  "data-extract": (dataSet, propPath, removeDuplicates = false) => {
    assertAssigned(
      dataSet,
      'DataSet param can not bu null!'
    );
    assertNotNullishString(
      propPath,
      'PropPath must be a path through data object properties ("*" allowed, ex. "posts.*.tags.*")!'
    )

    let result = extractDeep(dataSet, propPath.split('.'));

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
  "data-info-extract": (dataSet, propPath, removeDuplicates = false) => {
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