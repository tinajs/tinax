import base from './rollup.conf.base.js'

export default Object.assign({}, base, {
  output: {
    file: 'dist/wuex.js',
    format: 'umd',
    name: 'Wuex',
  },
})
