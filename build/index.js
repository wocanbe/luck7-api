const fs = require('fs')
const UglifyJS = require('uglify-es')

const fileList = [
  'index',
  'interface/mock',
  'interface/proxy',
  'interface/router',
  'interface/test',
  // 'lib/log',
  'lib/mockFile',
  'lib/testFile',
  'lib/utils'
]

const options = {
  mangle: {
    toplevel: true,
  },
  nameCache: {}
}
fileList.map((v) => {
  const code = fs.readFileSync('./cjs/' + v + '.js', 'utf8')
  const result = UglifyJS.minify(code, options)
  fs.writeFileSync('./dist/' + v + '.js', result.code, 'utf8')
})
