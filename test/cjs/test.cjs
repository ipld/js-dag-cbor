/* globals it */
const assert = require('assert')
const dagcbor = require('@ipld/dag-cbor')

const same = assert.deepStrictEqual
const test = it

test('dag-cbor imports basics', () => {
  same(typeof dagcbor, 'function')
})
