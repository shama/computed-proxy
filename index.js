const METAKEY = '__meta__'
module.exports = module.exports.computed = function computed (obj) {
  const handler = {
    get: function (target, name) {
      const prop = target[name]
      if (isComputedProperty(prop)) {
        const meta = prop[METAKEY]
        if (meta.dirty || meta.volatile) {
          meta.cache = meta.get.call(obj, name, meta.cache)
          meta.dirty = false
        }
        return meta.cache
      }
      // Return the prop (or as a ComputedArray if an Array)
      return asPropOrComputedArray(target, name)
    },
    set: function (target, name, value) {
      const prop = target[name]
      if (isComputedProperty(prop)) {
        const meta = prop[METAKEY]
        if (meta.readOnly) {
          throw new Error(name + ' is read only. Supply a set function to make this property settable.')
        }
        target[name] = meta.cache = meta.set.call(obj, name, value, meta.cache)
      } else if (isComputedProperty(value)) {
        target[name] = value
        indexComputedProperty(target, name)
      } else {
        target[name] = value
      }
      notifyPropertyChange(target, name)
      return true
    }
  }
  if (!obj[METAKEY]) {
    Object.defineProperty(obj, METAKEY, {
      enumerable: false,
      value: { bindings: Object.create(null) }
    })
  }
  reindexComputedProperties(obj)
  if (!obj.notifyPropertyChange) {
    obj.notifyPropertyChange = function (name) {
      notifyPropertyChange(obj, name)
    }
  }
  obj = new Proxy(obj, handler)
  return obj
}

module.exports.property = function property () {
  const bindings = Array.prototype.slice.call(arguments, 0, -1)
  const getset = Array.prototype.slice.call(arguments, -1)
  return new ComputedProperty(bindings, getset[0])
}

function ComputedProperty (bindings, getset) {
  getset = getset || {}
  Object.defineProperty(this, METAKEY, {
    enumerable: false,
    value: {
      bindings: bindings,
      dirty: true,
      volatile: false,
      readOnly: typeof getset.set !== 'function',
      cache: null,
      get: getset.get || function () { return null },
      set: getset.set || function (key, val) { return val }
    }
  })
}

ComputedProperty.prototype.volatile = function () {
  this[METAKEY].volatile = true
  return this
}

const arrayPropShim = ['push', 'unshift', 'pop', 'shift', 'splice', 'sort']
function ComputedArray (parent, property) {
  const handler = {
    get: function (target, name) {
      if (arrayPropShim.indexOf(name) !== -1) {
        return function () {
          // Check if we are adding a computed proxy to setup bindings
          let needReindex = false
          if (name === 'push' || name === 'unshift' || name === 'splice') {
            const args = Array.prototype.slice.call(arguments)
            for (var i = 0; i < args.length; i++) {
              if (isComputedProxy(args[i])) {
                needReindex = true
                break
              }
            }
          }
          const result = target[name].apply(target, Array.prototype.slice.call(arguments))
          if (needReindex) {
            reindexComputedProperties(parent)
          }
          parent.notifyPropertyChange(property)
          return result
        }
      }
      return target[name]
    }
  }
  parent[property] = new Proxy(parent[property], handler)
  return parent[property]
}

function indexComputedProperty (target, name) {
  const property = target[name]
  const propBindings = property[METAKEY].bindings
  for (var i = 0; i < propBindings.length; i++) {
    processBindings(target, propBindings[i].split('.'))
  }
  function processBindings (boundTarget, bindings) {
    bindings = bindings.slice()
    let binding = bindings.shift()
    while (binding) {
      if (isComputedProxy(boundTarget)) {
        pushToObjectArray(boundTarget[METAKEY].bindings, binding, function () {
          property[METAKEY].dirty = true
        })
        boundTarget = asPropOrComputedArray(boundTarget, binding)
      } else if (Array.isArray(boundTarget)) {
        const childBindings = bindings.slice()
        childBindings.unshift(binding)
        for (var i = 0; i < boundTarget.length; i++) {
          processBindings(boundTarget[i], childBindings)
        }
      }
      binding = bindings.shift()
    }
  }
}

function reindexComputedProperties (target) {
  Object.keys(target).forEach(function (name) {
    if (isComputedProperty(target[name])) {
      indexComputedProperty(target, name)
    }
  })
}

function notifyPropertyChange (target, name) {
  const bindings = (target && target[METAKEY] && target[METAKEY].bindings && target[METAKEY].bindings[name]) || []
  for (var i = 0; i < bindings.length; i++) {
    bindings[i].call(target, name)
  }
}

function isComputedProxy (prop) {
  return prop && prop[METAKEY] && prop[METAKEY].bindings
}

function isComputedProperty (prop) {
  return prop instanceof ComputedProperty
}

// Turn arrays into ComputedArrays if part of a ComputedProxy
function asPropOrComputedArray (target, name) {
  const prop = target[name]
  if (Array.isArray(prop)) {
    // TODO: Is this turning arrays in to computed arrays too much?
    return new ComputedArray(target, name)
  }
  return prop
}

function pushToObjectArray (obj, key, val) {
  if (!Array.isArray(obj[key])) {
    obj[key] = []
  }
  obj[key].push(val)
  return obj[key]
}
