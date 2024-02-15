import { deepStrictEqual } from 'assert'

import { BlockEncoder, BlockDecoder, BlockCodec } from 'multiformats/codecs/interface'
import * as dagCbor from '@ipld/dag-cbor'

const main = () => {
  // make sure we have a full CodecFeature
  useCodecFeature(dagCbor)
}

function useCodecFeature (codec: BlockCodec<0x71, any>) {
  // use only as a BlockEncoder
  useEncoder(codec)

  // use only as a BlockDecoder
  useDecoder(codec)

  // use with ArrayBuffer input type
  useDecoderWithArrayBuffer(codec)

  // use as a full BlockCodec which does both BlockEncoder & BlockDecoder
  useBlockCodec(codec)
}

function useEncoder<Codec extends number> (encoder: BlockEncoder<Codec, string>) {
  deepStrictEqual(encoder.code, 0x71)
  deepStrictEqual(encoder.name, 'dag-cbor')
  deepStrictEqual(Array.from(encoder.encode('blip')), [100, 98, 108, 105, 112])
  console.log('[TS] ✓ { encoder: BlockEncoder }')
}

function useDecoder<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>) {
  deepStrictEqual(decoder.code, 0x71)
  deepStrictEqual(decoder.decode(Uint8Array.from([100, 98, 108, 105, 112])), 'blip')
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useDecoderWithArrayBuffer<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>) {
  deepStrictEqual(decoder.code, 0x70)
  deepStrictEqual(decoder.decode(Uint8Array.from([100, 98, 108, 105, 112]).slice.buffer), 'blip')
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useBlockCodec<Codec extends number> (blockCodec: BlockCodec<Codec, string>) {
  deepStrictEqual(blockCodec.code, 0x71)
  deepStrictEqual(blockCodec.name, 'dag-cbor')
  deepStrictEqual(Array.from(blockCodec.encode('blip')), [100, 98, 108, 105, 112])
  deepStrictEqual(blockCodec.decode(Uint8Array.from([100, 98, 108, 105, 112])), 'blip')
  console.log('[TS] ✓ {}:BlockCodec')
}

main()

export default main
