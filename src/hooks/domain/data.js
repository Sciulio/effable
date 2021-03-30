const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { URL } = require('url');

const { get } = require('lodash');
const slugify = require('slugify');

const { emitHook, registerHook } = require('../../utils/hooks')
const { assertNotNullishString } = require('../../utils/asserts');
const routesHelper = require("../../helpers/routes")
const { fromPath, "data-info-extract": dataExtractInfo } = routesHelper;


registerHook(
  'files.data.conclude',
  async (ioFile, ctx) => {
  }
);