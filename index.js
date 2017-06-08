// require('proxy-polyfill')
module.exports = module.exports.computed = function computed (obj) {
  function indexComputedProperty (target, name) {
    const property = target[name]
    const propBindings = property.__meta__.bindings
    for (var i = 0; i < propBindings.length; i++) {
      const parts = propBindings[i].split('.')
      var boundTarget = target
      for (var j = 0; j < parts.length; j++) {
        const part = parts[j]
        if (isComputedProxy(boundTarget)) {
          pushToObjectArray(boundTarget.__meta__.bindings, part, function () {
            property.__meta__.dirty = true
          })
          boundTarget = boundTarget[part]
        }
      }
    }
  }
  function notifyPropertyChange (target, name) {
    const bindings = (target && target.__meta__ && target.__meta__.bindings && target.__meta__.bindings[name]) || []
    for (var i = 0; i < bindings.length; i++) {
      bindings[i].call(target, name)
    }
  }
  const handler = {
    get: function (target, name) {
      const prop = target[name]
      if (prop instanceof ComputedProperty) {
        const meta = prop.__meta__
        if (meta.dirty || meta.volatile) {
          meta.cache = meta.get.call(target, name)
          meta.dirty = false
        }
        return meta.cache
      }
      // Turn arrays into ComputedArrays if part of a ComputedProxy
      if (Array.isArray(prop) && !(prop instanceof ComputedArray)) {
        return new ComputedArray(target, name)
      }
      return prop
    },
    set: function (target, name, value) {
      const prop = target[name]
      if (prop instanceof ComputedProperty) {
        const meta = prop.__meta__
        if (meta.readOnly) {
          throw new Error(name + ' is read only. Supply a set function to make this property settable.')
        }
        target[name] = meta.cache = meta.set.call(target, name, value)
      } else if (value instanceof ComputedProperty) {
        target[name] = value
        indexComputedProperty(target, name)
      } else {
        target[name] = value
      }
      notifyPropertyChange(target, name)
      return true
    }
  }
  obj.__meta__ = { bindings: Object.create(null) }
  Object.keys(obj).forEach(function (name) {
    if (obj[name] instanceof ComputedProperty) {
      indexComputedProperty(obj, name)
    }
  })
  if (!obj.notifyPropertyChange) {
    obj.notifyPropertyChange = function (name) {
      notifyPropertyChange(obj, name)
    }
  }
  return new Proxy(obj, handler)
}

module.exports.property = function property () {
  const bindings = Array.prototype.slice.call(arguments, 0, -1)
  const getset = Array.prototype.slice.call(arguments, -1)
  return new ComputedProperty(bindings, getset[0])
}

function ComputedProperty (bindings, getset) {
  getset = getset || {}
  this.__meta__ = {
    bindings: bindings,
    dirty: true,
    volatile: false,
    readOnly: typeof getset.set !== 'function',
    cache: null,
    get: getset.get || function () { return null },
    set: getset.set || function (key, val) { return val }
  }
}

ComputedProperty.prototype.volatile = function () {
  this.__meta__.volatile = true
}

const arrayPropShim = ['push', 'unshift', 'pop', 'shift', 'splice', 'sort']
function ComputedArray (parent, property) {
  const handler = {
    get: function (target, name) {
      if (arrayPropShim.indexOf(name) !== -1) {
        return function () {
          parent.notifyPropertyChange(property)
          return target[name].apply(target, Array.prototype.slice.call(arguments))
        }
      }
    }
  }
  return new Proxy(parent[property], handler)
}

function isComputedProxy (prop) {
  return prop && prop.__meta__ && prop.__meta__.bindings
}

function pushToObjectArray (obj, key, val) {
  if (!Array.isArray(obj[key])) {
    obj[key] = []
  }
  obj[key].push(val)
  return obj[key]
}
