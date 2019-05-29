const chalk = require('chalk')
const isFunction = require('lodash/isFunction')
const isArray = require('lodash/isArray')
const isNumber = require('lodash/isNumber')
const isString = require('lodash/isString')

function getDataFromPath (mockPath, apiName, method, params, debug) {
  return new Promise((resolve, reject) => {
    if (apiName) {
      const filePath = mockPath + apiName
      let mockFile
      try {
        mockFile = require.resolve(process.cwd() + '/' + filePath)
      } catch (e) {
        reject(false)
      }
      if (mockFile) {
        if (debug) console.log(chalk`{cyanBright Mock used:} {white ${filePath}}`)
        try {
          delete require.cache[mockFile]
          const resultFile = require(mockFile)
          if (isFunction(resultFile.getData)) {
            const result = resultFile.getData(method, params)
            if (result instanceof Promise) {
              result.then((resData) => {
                resolve(resData)
              }).catch(e => {
                reject(e)
              })
            } else if (result instanceof Error) {
              reject(result)
            } else if (isArray(result)) {
              if (result.length === 2 && isNumber(result[0]) && isString(result[1])) {
                reject(result)
              } else {
                resolve(result)
              }
            } else {
              resolve(result)
            }
          } else {
            reject(new Error(apiName + ' has not mock method.'))
          }
        } catch (e) {
          console.error(e.stack)
          reject(new Error(apiName + ' has errors,please check the code.'))
        }
      }
    } else {
      reject(false)
    }
  })
}

module.exports = getDataFromPath
