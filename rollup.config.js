import base from './rollup.conf.base.js'

export default Object.assign({}, base, {
  output: {
    file: 'dist/tinax.js',
    format: 'umd',
    name: 'Tinax',
  },
})
