/* eslint-env mocha */
'use strict'
const garbage = require('garbage')
const assert = require('assert')
const dagCBOR = require('../')
const multiformats = require('multiformats/basics')
const { CID, multicodec, multibase, bytes } = multiformats
multibase.add(require('multiformats/bases/base58'))
multicodec.add(dagCBOR)

const encode = v => multicodec.encode(v, 'dag-cbor')
const decode = v => multicodec.decode(v, 'dag-cbor')

const test = it
const same = assert.deepStrictEqual

describe('util', () => {
  const obj = {
    someKey: 'someValue',
    link: new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
    links: [
      new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
      new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL')
    ],
    nested: {
      hello: 'world',
      link: new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL')
    }
  }
  const serializedObj = encode(obj)

  test('.serialize and .deserialize', () => {
    same(bytes.isBinary(serializedObj), true)

    // Check for the tag 42
    // d8 = tag, 2a = 42
    same(bytes.toHex(serializedObj).match(/d82a/g).length, 4)

    const deserializedObj = decode(serializedObj)
    same(obj, deserializedObj)
  })

  test('.serialize and .deserialize large objects', () => {
    // larger than the default borc heap size, should auto-grow the heap
    const dataSize = 128 * 1024
    const largeObj = { someKey: [].slice.call(new Uint8Array(dataSize)) }

    const serialized = encode(largeObj)
    same(bytes.isBinary(serialized), true)

    const deserialized = decode(serialized)
    same(largeObj, deserialized)
    // reset decoder to default
    dagCBOR.configureDecoder()
  })

  test('.deserialize fail on large objects beyond maxSize', () => {
    // larger than the default borc heap size, should bust the heap if we turn off auto-grow
    const dataSize = (128 * 1024) + 1
    const largeObj = { someKey: [].slice.call(new Uint8Array(dataSize)) }

    dagCBOR.configureDecoder({ size: 64 * 1024, maxSize: 128 * 1024 }) // 64 Kb start, 128 Kb max
    const serialized = encode(largeObj)
    same(bytes.isBinary(serialized), true)

    assert.throws(() => decode(serialized), /^Error: Data is too large to deserialize with current decoder$/)
    // reset decoder to default
    dagCBOR.configureDecoder()
  })

  test('.serialize and .deserialize object with slash as property', () => {
    const slashObject = { '/': true }
    const serialized = encode(slashObject)
    const deserialized = decode(serialized)
    same(deserialized, slashObject)
  })

  test('error catching', () => {
    const circlarObj = {}
    circlarObj.a = circlarObj
    assert.throws(() => encode(circlarObj), /^Error: The object passed has circular references$/)
  })

  test('fuzz serialize and deserialize with garbage', () => {
    for (let ii = 0; ii < 1000; ii++) {
      const original = { in: garbage(100) }
      const encoded = encode(original)
      const decoded = decode(encoded)
      same(decoded, original)
    }
  })
})
