const { resolve, join, relative, sep, extname, basename, dirname } = require('path');
const { promises: { stat, readdir, readFile, writeFile, mkdir } } = require('fs');

const { and, not, filterByExt } = require('../utils/bfunctional')
const { emitHook, registerHook } = require('../utils/hooks')

let YAML = require('yaml');
let mdMtadataParser = require('markdown-yaml-metadata-parser');


registerHook(
  'modules.init',
  async ({ yaml = yaml => yaml }) => {
    YAML = yaml(YAML) || YAML;
  }
);

registerHook(
  'modules.init',
  async ({ 'markdown-yaml-metadata-parser': mymp = mymp => mymp }) => {
    mdMtadataParser = mymp(mdMtadataParser) || mdMtadataParser;
  }
);


const filterContentWithMetadata = and(
  ({ content }) => content.substr(0, 3) == '---',
  ({ content }) => /^---$/m.test(content.substr(4))
)
const filterYaml = filterByExt('.yaml')

registerHook(
  'file.read.content',
  async (ioFile) => {
    ioFile.content = (await readFile(ioFile.path)).toString()
  }
);

// TODO: move YAML and mdMtadataParser in separate files and add registerDefaultHook(...) event register (called when no other handler had been call)
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
    'file.read.metadata.data'
  ],
  //todo 'file.read.metadata.*',
  filterYaml,
  async (ioFile) => {
    const metadata = YAML.parse(ioFile.content);

    ioFile.metadata = metadata;
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
    const outFilePath = resolve(join(out, url));

    await mkdir(dirname(outFilePath), { recursive: true });
    await writeFile(outFilePath, html);
  }
);