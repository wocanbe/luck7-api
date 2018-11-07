'use strict'
const isBoolean = require('lodash/isBoolean')
const getDataFromMock = require('../lib/mockFile')
const {checkOrigin, addCrosHeader, getMockParams} = require('../lib/utils')

class MockInterface {
  constructor (path, rules, config) {
    this.isCookie = config.crosCookie || false
    this.mockPath = config.mockPath || 'mock'
    this.allowOrigin = config.allowOrigin || []
    this.safeMode = isBoolean(config.safeMode) ? config.safeMode : false // 当host与origin一致时,是否进一步检查host

    this.run = (req, res, next) => {
      const reqPath = req.originalUrl || req.url
      if (reqPath.indexOf(path) === 0) {
        let params
        let targetFile = req.path.replace(path, '')
        // 如果包含地址栏参数，提取地址栏参数和模拟文件地址
        const result = getMockParams(rules, targetFile)
        if (result) {
          params = result[0]
          targetFile = result[1]
        }
        this.mock(req, res, params, targetFile)
      } else {
        next()
      }
    }
  }
  mock (req, res, params, mockFile) {
    if (checkOrigin(req, this.allowOrigin, this.safeMode)) { // 没通过模拟数据的域名授权
      res.status(403).send()
    } else {
      const targetFile = mockFile
      let apiRes
      let useParams = Object.assign({}, params, req.query)
      if (req.method === 'OPTIONS') {
        addCrosHeader(req, res, this.isCookie)
      } else if (req.method === 'GET') {
        apiRes = getDataFromMock(this.mockPath, targetFile, req.method, useParams)
      } else {
        useParams = Object.assign({}, useParams, req.body)
        apiRes = getDataFromMock(this.mockPath, targetFile, req.method, useParams)
      }
      if (apiRes) {
        addCrosHeader(req, res, this.isCookie)
        apiRes.then(result => {
          res.send(result)
        }).catch(e => {
          if (e.message === 'Status 404') {
            res.status(404).send()
          } else {
            res.status(500).send(e.message)
          }
        })
      }
    }
  }
}

module.exports = MockInterface
