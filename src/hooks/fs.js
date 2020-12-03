const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');
const { existsSync } = require('fs');

const { emitHook, registerHook } = require('../utils/hooks')

const YAML = require('yaml');
const mdMtadataParser = require('markdown-yaml-metadata-parser');


registerHook(
  'modules.init',
  async ({ yaml = yaml => yaml }) => {
    YAML = yaml(YAML);
  }
);

registerHook(
  'modules.init',
  async ({ 'markdown-yaml-metadata-parser': mymp = mymp => mymp }) => {
    mdMtadataParser = mymp(mdMtadataParser);
  }
);


const and = (...funcs) => arg => funcs.every(func => func(arg))
const or = (...funcs) => arg => funcs.some(func => func(arg))
const not = (func) => (...args) => !func(...args)

const filterContentWithMetadata = ({ content }) => content.substr(0, 3) == '---'
const filterYaml = ({ ext }) => ext === '.yaml'

registerHook(
  'file.read.content',
  async (ioFile) => {
    ioFile.content = (await readFile(ioFile.path)).toString()
  }
);

registerHook([
    'file.read.metadata.data',
    'file.read.metadata.partials',
    'file.read.metadata.views'
  ],
  and(not(filterContentWithMetadata), not(filterYaml)),
  async (ioFile) => {
    ioFile.metadata = {};
    ioFile.body = ioFile.content;
  }
);

registerHook([
    'file.read.metadata.data',
//    'file.read.metadata.partials',
//    'file.read.metadata.views'
  ],
  //todo 'file.read.metadata.*',
  filterYaml,
  async (ioFile) => {
    ioFile.metadata = YAML.parse(ioFile.content);
    ioFile.body = undefined;
  }
);

registerHook([
    'file.read.metadata.data',
    'file.read.metadata.partials',
    'file.read.metadata.views'
  ],
  filterContentWithMetadata,
  async (ioFile) => {
    const { metadata, content } = mdMtadataParser(ioFile.content);

    ioFile.metadata = metadata;
    ioFile.body = content;
  }
);

registerHook(
  'routes.io.persist',
  async ({ url, html }, { config: { paths: { out } }}) => {
    const outFilePath = resolve(join(out, url + '.html'));

    await mkdir(dirname(outFilePath), { recursive: true });
    await writeFile(outFilePath, html);
  }
);