const { resolve, normalize, join, relative, sep, extname, basename, dirname } = require('path');
const { readdir, readFile, writeFile, mkdir, stat } = require('fs').promises;



const min = (...args) => args
.filter(Boolean)
.sort()[0]

async function mapGlobFile(from, path) {
  const fileStat = await stat(path)

  return {
    path,
    folder: relative(join(process.cwd(), from), dirname(path)),
    file: basename(path),
    name: basename(path, extname(path)),
    ext: extname(path),
    size: fileStat.size,
    createdOn: fileStat.birthtimeMs,
    editedOn: min(fileStat.mtimeMs, fileStat.ctimeMs, fileStat.birthtimeMs),
    stat: fileStat
  }
}

module.exports = {
  async mapDataFile(from, path) {
    return {
      ...await mapGlobFile(from, path)
    }
  },
  async mapPartialFile(from, path) {
    return {
      ...await mapGlobFile(from, path),
    }
  },
  async mapViewFile(from, path) {
    return {
      ...await mapGlobFile(from, path),
      isIndex: basename(path, extname(path)) == 'index',
      isLayout: basename(path, extname(path)) == '_layout',
      isTemplate: basename(path)[0] == '_'
    }
  }
}