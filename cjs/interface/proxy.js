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
        pathRewrite,
        onError: function (err, req, res) {
          let errMsg = ''
          if (err.code === 'ETIMEDOUT') errMsg = '请求超时'
          if (err.code === 'ENETUNREACH') errMsg = '网络未连接'
          if (err.code === 'ECONNREFUSED') errMsg = '服务器拒绝连接'
          res.writeHead(500, {
            'Content-Type': 'text/plain;charset=utf-8'
          })
          res.end(errMsg)
        }
      })
    }
    // useConfig中的changeOrigin设为true，仅仅修改了headers.host，没有修改origin，这种处理也不能通过一些跨域的检查
    this.run = proxy(path, useConfig)
  }
}

module.exports = ProxyInterface
