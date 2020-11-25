const hooks = {}


const match = namespace => {
  if (!namespace.includes('*')) {
    return [namespace];
  }
  //todo: add '**'
  const namespaces = namespace.split('.');
  const namespacesCount = namespaces.length;
  return Object.keys(hooks)
  .filter(name => name.split('.').length == namespacesCount)
  .filter(name => name.split('.')
    .reduce((p, n, id) => {
      return (namespaces.length > id && (namespaces[id] == n || namespaces[id] == '*')) && p;
    }, true)
  )
}

module.exports = {
  registerHook(name, filterOrHook, hook = undefined) {
    if (!hook) {
      hook = filterOrHook;
      filterOrHook = null;
    }

    if (!Array.isArray(name)) {
      name = [ name ]
    }

    name
    .forEach(
      nm => (hooks[nm] = hooks[nm] || [])
      .push([filterOrHook, hook])
    );
  },
  emitHook: async (name, ...args) => {
    return Promise.all(
      hooks[name]
      .filter(([filter, _]) => filter == null || filter(...args))
      .map(([_, hook]) => hook(...args))
      /*
      match(name)
      .reduce((list, flattened) => [
        ...flattened,
        ...list
        .filter(([filter, _]) => filter == null || filter(...args))
        .map(([_, hook]) => hook(...args))
      ], [])*/
    )
  }
};