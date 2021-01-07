const trufy = v => v === 0 || !!v;

module.exports = {
  and: (...funcs) => (...arg) => funcs.every(func => func(...arg)),
  or: (...funcs) => (...arg) => funcs.some(func => func(...arg)),
  not: (func) => (...args) => !func(...args),

  lower: (...tsList) => tsList.filter(trufy).sort()[0],
  higher: (...tsList) => tsList.filter(trufy).sort().reverse()[0],

  through: (...funcs) => (...args) => funcs.map(func => func(...args)),
  carry: (func, argsToSlice = 1) => (...args) => func(...args.slice(argsToSlice)),

  filterByExt: (...extList) => ({ ext }) => extList.includes(ext),

  flatten: lists => lists.reduce((list, sub) => [...list, ...sub], [])
}