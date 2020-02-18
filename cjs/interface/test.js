const ProxyInterface = require('./proxy')
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
class TestInterface extends ProxyInterface {
  constructor (path, rules, config) {
    const mockPath = config.mockPath || 'mock'
    const onProxyRes = function (proxyRes, req, res) {
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
          res.status(status).send(proxyRes.statusMessage)
        }
      }
    }
    config['onProxyRes'] = onProxyRes
    config['selfHandleResponse'] = true
    config['onProxyReq'] = function (proxyReq, req) {
      if (req.body) {
        let bodyData = JSON.stringify(req.body)
        // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
        proxyReq.setHeader('Content-Type','application/json')
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
        // stream the content
        proxyReq.write(bodyData)
      }
    }
    super(path, rules.proxy, config)
  }
}

module.exports = TestInterface
