// @ts-expect-error no types
const CID = require('cids')

export default {
  foo: 'bar',
  cats: [
    new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
    {
      something: 'interesting'
    },
    [
      'fish',
      new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL'),
      9
    ]
  ],
  other: new CID('QmRgutAxd8t7oGkSm4wmeuByG6M51wcTso6cubDdQtuEfL')
}
