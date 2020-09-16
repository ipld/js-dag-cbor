/* eslint-env mocha */
'use strict'
import garbage from 'garbage'
import assert from 'assert'
import { configureDecoder, configure } from '../index.js'
import multiformats, { bytes } from 'multiformats'
import { base58btc } from 'multiformats/bases/base58'
import { base32 } from 'multiformats/bases/base32'
import { sha256 } from 'multiformats/hashes/sha2'

const config = {
  base: base32,
  base58btc,
  hasher: sha256
}
const { cid } = multiformats(config)
const { encode, decode } = configure(config)

const test = it
const same = assert.deepStrictEqual

describe('dag-cbor', () => {
  const obj = {
    someKey: 'someValue',
    link: cid.from('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
    links: [
      cid.from('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
      cid.from('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL')
    ],
    nested: {
      hello: 'world',
      link: cid.from('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL')
    },
    bytes: Buffer.from('asdf')
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
    configureDecoder()
  })

  test('.deserialize fail on large objects beyond maxSize', () => {
    // larger than the default borc heap size, should bust the heap if we turn off auto-grow
    const dataSize = (128 * 1024) + 1
    const largeObj = { someKey: [].slice.call(new Uint8Array(dataSize)) }

    configureDecoder({ size: 64 * 1024, maxSize: 128 * 1024 }) // 64 Kb start, 128 Kb max
    const serialized = encode(largeObj)
    same(bytes.isBinary(serialized), true)

    assert.throws(() => decode(serialized), /^Error: Data is too large to deserialize with current decoder$/)
    // reset decoder to default
    configureDecoder()
  })

  test('.deserialize fail on large objects beyond maxSize - omit size', () => {
    // larger than the default borc heap size, should bust the heap if we turn off auto-grow
    const dataSize = (128 * 1024) + 1
    const largeObj = { someKey: [].slice.call(new Uint8Array(dataSize)) }

    configureDecoder({ maxSize: 128 * 1024 }) // 64 Kb start, 128 Kb max
    const serialized = encode(largeObj)
    same(bytes.isBinary(serialized), true)

    assert.throws(() => decode(serialized), /^Error: Data is too large to deserialize with current decoder$/)
    // reset decoder to default
    configureDecoder()
  })

  test('.serialize and .deserialize object with slash as property', () => {
    const slashObject = { '/': true }
    const serialized = encode(slashObject)
    const deserialized = decode(serialized)
    same(deserialized, slashObject)
  })

  test('CIDs have clean for deep comparison', () => {
    const deserializedObj = decode(serializedObj)
    // backing buffer must be pristine as some comparison libraries go that deep
    const actual = deserializedObj.link.bytes.join(',')
    const expected = obj.link.bytes.join(',')
    same(actual, expected)
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

  test('CIDv1', () => {
    const { cid } = multiformats({ ...config, base: base58btc })
    const { encode, decode } = configure({ ...config, base: base58btc })

    const link = cid.from('zdj7Wd8AMwqnhJGQCbFxBVodGSBG84TM7Hs1rcJuQMwTyfEDS')
    console.log({ ...link })

    const encoded = encode({ link })
    const decoded = decode(encoded)
    same(decoded, { link })
  })

  test('encode and decode consistency  with Uint8Array and Buffer fields', () => {
    const buffer = Buffer.from('some data')
    const bytes = Uint8Array.from(buffer)

    const s1 = encode({ data: buffer })
    const s2 = encode({ data: bytes })

    same(s1, s2)

    const verify = (s) => {
      same(typeof s, 'object')
      same(Object.keys(s), ['data'])
      assert(s.data instanceof Uint8Array)
      same(s.data.buffer, bytes.buffer)
    }
    verify(decode(s1))
    verify(decode(s2))
  })

  test('reject extraneous, but valid CBOR data after initial top-level object', () => {
    assert.throws(() => {
      // two top-level CBOR objects, the original and a single uint=0, valid if using
      // CBOR in streaming mode, not valid here
      decode(Buffer.concat([Buffer.from(serializedObj), Buffer.alloc(1)]))
    }, /^Error: Extraneous CBOR data found beyond initial top-level object/)
  })
})
