# computed-proxy

Computed properties with [JavaScript Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

### Examples

```js
const computed = require('computed-proxy')

const person = computed({
  lastName: 'Robinson Young',
  fullName: computed.property('firstName', 'lastName', {
    get () {
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
    get () {
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
  who: computed.property('person.name', 'person.age', {
    get () {
      return `${this.person.name} is ${this.person.age} years old`
    }
  })
})

console.log(profile.who) // Kyle is 34 years old

profile.person.name = 'Crystal'
profile.person.age = 33
console.log(profile.who) // Crystal is 33 years old
```

### Similar Projects

* npmjs.com/computed
* Ember.js Computed Properties
