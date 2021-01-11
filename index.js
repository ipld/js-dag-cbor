// @ts-check

import * as cborg from 'cborg'
// @ts-ignore
import { CID } from 'multiformats'

// https://github.com/ipfs/go-ipfs/issues/3570#issuecomment-273931692
const CID_CBOR_TAG = 42
const code = 0x71
const name = 'dag-cbor'

// this will receive all Objects, we need to filter out anything that's not
// a CID and return `null` for that so it's encoded as normal
function cidEncoder (obj) {
  if (obj.asCID !== obj) {
    return null // any other kind of object
  }
  const cid = CID.asCID(obj)
  /* c8 ignore next 4 */
  // very unlikely case, and it'll probably throw a recursion error in cborg
  if (!cid) {
    return null
  }
  const bytes = new Uint8Array(cid.bytes.byteLength + 1)
  bytes.set(cid.bytes, 1) // prefix is 0x00, for historical reasons
  return [
    new cborg.Token(cborg.Type.tag, CID_CBOR_TAG),
    new cborg.Token(cborg.Type.bytes, bytes)
  ]
}

function undefinedEncoder () {
  throw new Error('`undefined` is not supported by the IPLD Data Model and cannot be encoded')
}

function numberEncoder (num) {
  if (Number.isNaN(num)) {
    throw new Error('`NaN` is not supported by the IPLD Data Model and cannot be encoded')
  }
  if (num === Infinity || num === -Infinity) {
    throw new Error('`Infinity` and `-Infinity` is not supported by the IPLD Data Model and cannot be encoded')
  }
}

const encodeOptions = {
  float64: true,
  typeEncoders: {
    Object: cidEncoder,
    undefined: undefinedEncoder,
    number: numberEncoder
  }
}

function encode (node) {
  return cborg.encode(node, encodeOptions)
}

function cidDecoder (bytes) {
  if (bytes[0] !== 0) {
    throw new Error('Invalid CID for CBOR tag 42; expected leading 0x00')
  }
  return CID.decode(bytes.subarray(1)) // ignore leading 0x00
}

const decodeOptions = {
  allowIndefinite: false,
  allowUndefined: false,
  allowNaN: false,
  allowInfinity: false,
  allowBigInt: true, // this will lead to BigInt for ints outside of
  // safe-integer range, which may surprise users
  strict: true,
  useMaps: false,
  tags: []
}
decodeOptions.tags[CID_CBOR_TAG] = cidDecoder

function decode (data) {
  return cborg.decode(data, decodeOptions)
}

export { name, code, encode, decode }
