# computed-proxy

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Downloads][downloads-image]][downloads-url]
[![js-standard-style][standard-image]][standard-url]
![experimental][experimental-image]

Computed properties with [JavaScript Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

### Examples

```js
const computed = require('computed-proxy')

const person = computed({
  lastName: 'Robinson Young',
  fullName: computed.property('firstName', 'lastName', {
    get (key, previous) {
      return `${this.firstName} ${this.lastName}`
    }
  })
})

person.firstName = 'Kyle'
console.log(person.fullName) // Kyle Robinson Young

person.firstName = 'Crystal'
console.log(person.fullName) // Crystal Robinson Young
```

With Arrays:

```js
const computed = require('computed-proxy')

const restaurant = computed({
  food: ['sushi'],
  menu: computed.property('food', {
    get (key, previous) {
      return this.food.join(', ')
    }
  })
})

console.log(restaurant.menu) // sushi

restaurant.food.push('steak')
console.log(restaurant.menu) // sushi, steak
```

With nested properties:

```js
const computed = require('computed-proxy')

const profile = computed({
  person: computed({
    name: 'Kyle',
    age: 34
  }),
  howOld: computed.property('person.name', 'person.age', {
    get (key, previous) {
      return `${this.person.name} is ${this.person.age} years old`
    }
  })
})

console.log(profile.howOld) // Kyle is 34 years old

profile.person.name = 'Crystal'
profile.person.age = 33
console.log(profile.howOld) // Crystal is 33 years old
```

With Properties Nested in Arrays:

```js
const computed = require('computed-proxy')

const restaurant = computed({
  food: [
    computed({ name: 'sushi', price: 50 })
  ],
  menu: computed.property('food.name', 'food.price', {
    get (key, previous) {
      return this.food.map(function (item) {
        return `${item.name} costs ${item.price}`
      }).join(', ')
    }
  })
})

console.log(restaurant.menu) // sushi costs 50

restaurant.food.push(computed({ name: 'steak', price: 60 }))
console.log(restaurant.menu) // sushi costs 50, steak costs 60

restaurant.food[0].price = 70
console.log(restaurant.menu) // sushi costs 70, steak costs 60
```

In an environment that doesn't support `Proxy`? Shim it by including this in your code:

```js
require('computed-proxy/shim')
```

### Similar Projects

* [npmjs.com/computed](https://www.npmjs.com/package/computed)
* [Ember.js Computed Property](https://emberjs.com/api/classes/Ember.ComputedProperty.html)

# license
(c) 2017 Kyle Robinson Young. MIT License

[npm-image]: https://img.shields.io/npm/v/computed-proxy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/computed-proxy
[travis-image]: https://img.shields.io/travis/shama/computed-proxy/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/shama/computed-proxy
[downloads-image]: http://img.shields.io/npm/dm/vel.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/computed-proxy
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[experimental-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
