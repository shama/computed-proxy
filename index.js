require('proxy-polyfill')
module.exports = module.exports.computed = function computed(obj) {
  const bindings = Object.create(null)
  function updatePropertyBindings (target) {
    Object.keys(target).forEach(function (name) {
      const prop = target[name]
      if (prop instanceof ComputedProperty) {
        const propBindings = prop.__meta__.bindings
        for (var i = 0; i < propBindings.length; i++) {
          if (!Array.isArray(bindings[propBindings[i]])) {
            bindings[propBindings[i]] = []
          }
          bindings[propBindings[i]].push(name)
        }
      }
    })
    if (!target.notifyPropertyChange) {
      target.notifyPropertyChange = function (name) {
        notifyPropertyChange(target, name)
      }
    }
    return target
  }
  function notifyPropertyChange (target, name) {
    if (bindings[name]) {
      for (var i = 0; i < bindings[name].length; i++) {
        const boundProp = target[bindings[name][i]]
        if (boundProp instanceof ComputedProperty) {
          boundProp.__meta__.dirty = true
        }
      }
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
      if (Array.isArray(prop) && !(prop instanceof ComputedArray)) {
        return new ComputedArray(target, name)
      }
      return prop
    },
    set: function (target, name, value) {
      var isDynamicBypassReadOnly = false
      if (value instanceof ComputedProperty) {
        target[name] = value
        updatePropertyBindings(target)
        isDynamicBypassReadOnly = true
      }
      const prop = target[name]
      if (prop instanceof ComputedProperty) {
        const meta = prop.__meta__
        if (meta.readOnly && !isDynamicBypassReadOnly) {
          throw new Error(name + ' is read only. Supply a set function to make this property settable.')
        }
        target[name] = meta.cache = meta.set.call(target, name, value)
      } else {
        target[name] = value
      }
      notifyPropertyChange(target, name)
      return true
    }
  }
  return new Proxy(updatePropertyBindings(obj), handler)
}

module.exports.property = function property() {
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
    set: getset.set || function (key, val) { return val },
  }
}

ComputedProperty.prototype.volatile = function () {
  this.__meta__.volatile = true
}

const arrayPropShim = ['push', 'unshift', 'pop', 'shift', 'splice']
function ComputedArray (parent, property) {
  const handler = {
    get: function (target, name) {
      if (arrayPropShim.indexOf(name) !== -1) {
        return function () {
          parent.notifyPropertyChange(property + '.[]')
          return target[name].apply(target, Array.prototype.slice.call(arguments))
        }
      }
    }
  }
  return new Proxy(parent[property], handler)
}
