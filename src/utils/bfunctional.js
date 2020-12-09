const trufy = v => v === 0 || !!v;

module.exports = {
  and: (...funcs) => arg => funcs.every(func => func(arg)),
  or: (...funcs) => arg => funcs.some(func => func(arg)),
  not: (func) => (...args) => !func(...args),

  higher: (...tsList) => tsList.filter(trufy).sort()[0],

  carry: (func, argsToSlice = 1) => (...args) => func(...args.slice(argsToSlice)),

  filterByExt: (...extList) => ({ ext }) => extList.includes(ext)
}