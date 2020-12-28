module.exports = {
  parseUrl: (...parts) => parts[0].indexOf("http") == 0 ? new URL(parts.slice(1).join('/'), parts[0]).href : parts.join('/')
}