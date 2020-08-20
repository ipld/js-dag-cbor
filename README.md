# @ipld/dag-cbor

JS implementation of `dag-cbor`.

This is the *new* interface meant for use with `multiformats` and
`@ipld/block`. It is not used by `js-ipld-format` which is currently
used in IPFS. That library is [here](https://github.com/ipld/js-ipld-dag-cbor).

Usage (w/ Block Interface):

```javascript
const multiformats = require('multiformats/basics')
multiformats.add(require('@ipld/dag-cbor'))
const Block = require('@ipld/block')(multiformats)
const { CID } = multiformats

const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, CID.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: CID.from('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}

let encoder = Block.encoder(obj, 'dag-json')
let encoded = await Block.encode() // binary encoded block
let decoded = await Block.decoder(encoded, 'dag-json').decode()
decoded.y[0] // 2
CID.asCID(decoded.z.a) // cid instance
```


