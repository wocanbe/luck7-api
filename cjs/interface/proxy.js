const proxy = require('http-proxy-middleware')
const isArray = require('lodash/isArray')
const extend = require('lodash/extend')

class ProxyInterface {
  constructor (path, rules, config) {
    let useConfig = config
    let pathRewrite
    if (isArray(rules) && rules.length > 0) {
      pathRewrite = {}
      rules.map(item => {
        pathRewrite[item.path] = item.target
      })
    }
    if (pathRewrite) {
      useConfig = extend(useConfig, {
        pathRewrite
      })
    }
    // useConfig中的changeOrigin设为true，仅仅修改了headers.host，没有修改origin，这种处理也不能通过一些跨域的检查
    this.run = proxy(path, useConfig)
  }
}

module.exports = ProxyInterface
