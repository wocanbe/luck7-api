'use strict'
const Router = require('./interface/router')

module.exports = function (apiConfig) {
  let middleware = new Router(apiConfig)
  return middleware.run()
}
