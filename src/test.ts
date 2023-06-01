import { Collection } from "discord.js";

const firstCollection = new Collection<string, {}>()
const secondCollection = new Collection<string, {}>()

firstCollection
  .set('hi', {
    name: 'hi',
    description: 'lmao'
  })
  .set('hello', {
    name: 'hello',
    description: 'oof'
  })
// .set('hi', 'hi')
// .set('hello', 'hello')

secondCollection
  .set('hi', {
    name: 'hi',
    description: 'lmao'
  })
// .set('hi', 'hi')

console.log('FIRST:', firstCollection.difference(secondCollection))
console.log('FIRST:', firstCollection.subtract(secondCollection))

console.log('SECOND:', secondCollection.difference(firstCollection))
console.log('SECOND:', secondCollection.subtract(firstCollection))

console.log('CONCAT:', secondCollection.concat(firstCollection))