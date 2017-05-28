# computed-proxy

Ember-like computed properties using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

### Examples

```js
const computed = require('computed-proxy')
const property = computed.property

const person = computed({
  lastName: 'Robinson Young',
  fullName: property('firstName', 'lastName', {
    get() {
      return `${this.firstName} ${this.lastName}`
    }
  })
})

person.firstName = 'Kyle'
console.log(person.fullName) // Kyle Robinson Young

person.firstName = 'Crystal'
console.log(person.fullName) // Crystal Robinson Young
```
