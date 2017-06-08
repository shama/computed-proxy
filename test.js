const test = require('tape')
const computed = require('./index')

test('computes a simple property', (t) => {
  t.plan(2)
  const person = computed({
    lastName: 'Robinson Young',
    fullName: computed.property('firstName', 'lastName', {
      get () {
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

test('dynamically add computed properties', (t) => {
  t.plan(2)
  const person = computed({
    firstName: 'Kyle',
    lastName: 'Robinson Young'
  })
  person.fullName = computed.property('firstName', 'lastName', {
    get () {
      return `${this.firstName} ${this.lastName}`
    }
  })
  t.equal(person.fullName, 'Kyle Robinson Young')
  person.firstName = 'Crystal'
  t.equal(person.fullName, 'Crystal Robinson Young')
  t.end()
})

test('computes an array', (t) => {
  t.plan(7)
  const inventory = computed({
    items: ['one'],
    itemList: computed.property('items', {
      get () {
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
  inventory.items.sort()
  t.equal(inventory.itemList, '1 point 5, one')
  t.end()
})

// TODO: Make this work
test.skip('computes properties of arrays', (t) => {
  const inventory = computed({
    items: [
      computed({ name: 'one' })
    ],
    itemList: computed.property('items.@each.name', {
      get () {
        return this.items.map(function (item) {
          return item.name
        }).join(', ')
      }
    })
  })
  t.equal(inventory.itemList, 'one')
  inventory.items.push(computed({name: 'two'}))
  t.equal(inventory.itemList, 'one, two')
  t.end()
})

test('computes nested computed proxies', (t) => {
  t.plan(7)
  const profile = computed({
    person: computed({
      name: 'Kyle',
      age: 34,
      children: ['Issac', 'Oliver']
    }),
    howOld: computed.property('person.name', 'person.age', {
      get () {
        return `${this.person.name} is ${this.person.age} years old`
      }
    }),
    kids: computed.property('person.children', {
      get () {
        return this.person.children.join(', ')
      }
    }),
    personAsJSON: computed.property('person', {
      get () {
        return JSON.stringify(this.person)
      }
    })
  })
  t.equal(profile.howOld, 'Kyle is 34 years old')
  t.equal(profile.kids, 'Issac, Oliver')
  t.equal(profile.personAsJSON, '{"name":"Kyle","age":34,"children":["Issac","Oliver"]}')
  profile.person.name = 'Crystal'
  profile.person.age = 33
  profile.person.children.push('Oh no!')
  t.equal(profile.howOld, 'Crystal is 33 years old')
  t.equal(profile.kids, 'Issac, Oliver, Oh no!', 'A kid was added')
  t.equal(profile.personAsJSON, '{"name":"Kyle","age":34,"children":["Issac","Oliver"]}', 'person itself hasnt been set, so this doesnt fire')
  profile.person = computed({name: 'Crystal', age: 33, children: ['Issac', 'Oliver', 'Oh no!']})
  t.equal(profile.personAsJSON, '{"name":"Crystal","age":33,"children":["Issac","Oliver","Oh no!"]}', 'only after person is set will it fire')
  t.end()
})

// test('cannot set read only')
// test('setting volatile works everytime')
