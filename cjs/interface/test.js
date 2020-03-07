const isArray = require('lodash/isArray')
const extend = require('lodash/extend')
const Proxy = require('../lib/testProxy')
const testDataFromMock = require('../lib/testFile')
const {getMockParams} = require('../lib/utils')

function test (mockPath, req, res, resData, testFile, reqPath) {
  const targetFile = testFile
  let apiRes
  let reqParams = Object.assign({}, req.query)
  if (req.method === 'GET') {
    apiRes = testDataFromMock(mockPath, targetFile, req.method, reqParams, resData, reqPath)
  } else {
    reqParams = Object.assign({}, reqParams, req.body)
    apiRes = testDataFromMock(mockPath, targetFile, req.method, reqParams, resData, reqPath)
  }
  if (apiRes) {
    apiRes.then(result => {
      res.send(result)
    }).catch(e => {
      if (e instanceof Array) {
        res.status(e[0]).send(e[1])
      } else if (e instanceof Error) {
        res.status(500).send(e.message)
      } else {
        console.warn(mockPath + targetFile + ' has\'t testData method or is\'t exist.')
        res.end(resData)
      }
    })
  }
}

let getErrorFun = function (errorFun) {
  return function (req, res, status, resData) {
    let reqPath = req.originalUrl.split('?')[0]
    let reqData = Object.assign({}, req.query)
    if (req.method !== 'GET') reqData = Object.assign({}, reqData, req.body)
    if (errorFun) errorFun(req.method, reqData, resData, reqPath, status)
    res.status(status).send(resData)
  }
}
class TestInterface {
  constructor (path, rules, config) {
    let useConfig = config
    let pathRewrite
    if (isArray(rules.proxy) && rules.proxy.length > 0) {
      pathRewrite = {}
      rules.proxy.map(item => {
        pathRewrite[item.path] = item.target
      })
    }
    const errorBack = getErrorFun(config.errorFun)
    if (pathRewrite) {
      const mockPath = config.mockPath || 'mock'
      useConfig = extend(useConfig, {
        pathRewrite,
        selfHandleResponse: true,
        onProxyReq: function (proxyReq, req) {
          if (req.body) {
            let bodyData = JSON.stringify(req.body)
            // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            proxyReq.setHeader('Content-Type','application/json')
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
            // stream the content
            proxyReq.write(bodyData)
          }
        },
        onProxyRes: function (proxyRes, req, res) {
          const reqPath = req.originalUrl.split('?')[0]
          if (reqPath.indexOf(path) === 0) {
            let targetFile = req.path.replace(path, '')
            const result = getMockParams(rules.test, targetFile)
            if (result) targetFile = result[1]
            let status = proxyRes.statusCode
            if (status === 200) {
              let resData = new Buffer('')
              proxyRes.on('data', function (data) {
                resData = Buffer.concat([resData, data])
              })
              proxyRes.on('end', function () {
                let formatData
                try {
                  formatData = JSON.parse(resData.toString())
                } catch (e) {
                  formatData = resData.toString()
                }
                test(mockPath, req, res, formatData, targetFile, reqPath.replace(path, ''))
              })
            } else {
              errorBack(req, res, status, proxyRes.statusMessage)
            }
          }
        },
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
    this.run = new Proxy(path, useConfig)
  }
}

module.exports = TestInterface
