import uglify from 'rollup-plugin-uglify'
import base from './rollup.conf.base.js'

export default Object.assign({}, base, {
  output: {
    file: 'dist/tinax.min.js',
    format: 'umd',
    name: 'Tinax',
  },
  plugins: base.plugins.concat([
    uglify(),
  ]),
})
