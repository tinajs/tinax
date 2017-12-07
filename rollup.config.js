import merge from 'deepmerge'
import base from './rollup.config.base.js'

export default merge(base, {
  output: {
    file: 'dist/tinax.js',
    format: 'umd',
    name: 'Tinax',
  },
})
