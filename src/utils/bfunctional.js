module.exports = {
  and: (...funcs) => arg => funcs.every(func => func(arg)),
  or: (...funcs) => arg => funcs.some(func => func(arg)),
  not: (func) => (...args) => !func(...args),

  filterByExt: (...extList) => ({ ext }) => extList.includes(ext)
}