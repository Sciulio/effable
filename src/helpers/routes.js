const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { promisedGlob } = require("../utils/fs");
const { assertAssigned, assertNotNullishString } = require('../utils/asserts');


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
    return routesEach(({ __isContent }) => __isContent, ...arguments);
  },
  "routes-binded-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isBinded }) => __isBinded, ...arguments);
  },
  "data-each": function(routesSet, sortBy = null, take = null) {
    return routesEach(({ __isData }) => __isData, ...arguments);
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