import globby from 'globby'
import path from 'path'

let configs = [{
  input: 'index.js',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs'
  }
}]

const _filter = p => !p.includes('/_') && !p.includes('rollup.config')

const relativeToMain = name => ({
  name: 'relative-to-main',
  renderChunk: source => {
    while (source.includes("require('../index.js')")) {
      source = source.replace("require('../index.js')", `require('${name}')`)
    }
    return source
  }
})

const plugins = [relativeToMain('@ipld/dag-cbor')]
const add = (pattern) => {
  configs = configs.concat(globby.sync(pattern).filter(_filter).map(inputFile => ({
    input: inputFile,
    output: {
      plugins,
      file: path.join('dist', inputFile).replace('.js', '.cjs'),
      format: 'cjs'
    }
  })))
}
add('test/*.js')
console.log(configs)

export default configs
