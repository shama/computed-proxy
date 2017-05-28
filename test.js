const test = require('tape')
const computed = require('./index')

test('computes a simple property', (t) => {
  const person = computed({
    lastName: 'Robinson Young',
    fullName: computed.property('firstName', 'lastName', {
      get() {
        return `${this.firstName} ${this.lastName}`
      }
    })
  })
  person.firstName = 'Kyle'
  t.equal(person.fullName, 'Kyle Robinson Young')
  person.firstName = 'Crystal'
  t.equal(person.fullName, 'Crystal Robinson Young')
  t.end()
})

test('computes an array', (t) => {
  const inventory = computed({
    items: ['one'],
    itemList: computed.property('items.[]', {
      get() {
        return this.items.join(', ')
      }
    })
  })
  t.equal(inventory.itemList, 'one')
  inventory.items.push('two')
  t.equal(inventory.itemList, 'one, two')
  inventory.items.splice(1, 0, '1 point 5')
  t.equal(inventory.itemList, 'one, 1 point 5, two')
  inventory.items.pop()
  t.equal(inventory.itemList, 'one, 1 point 5')
  inventory.items.unshift('zero')
  t.equal(inventory.itemList, 'zero, one, 1 point 5')
  inventory.items.shift()
  t.equal(inventory.itemList, 'one, 1 point 5')
  t.end()
})

// TODO: Make this work
// test('computes properties of arrays', (t) => {
//   const inventory = computed({
//     items: computed.array([
//       computed({ name: 'one' })
//     ]),
//     itemList: computed.property('items.@each.name', {
//       get() {
//         return this.items.map(function (item) {
//           return item.name
//         }).join(', ')
//       }
//     })
//   })
//   t.equal(inventory.itemList, 'one')
//   inventory.items.push(computed({name: 'two'}))
//   t.equal(inventory.itemList, 'one, two')
//   t.end()
// })
