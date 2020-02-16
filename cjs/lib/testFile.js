const chalk = require('chalk')
const isFunction = require('lodash/isFunction')
const isArray = require('lodash/isArray')
const isNumber = require('lodash/isNumber')
const isString = require('lodash/isString')

function getDataFromPath (mockPath, apiName, reqMethod, reqData, resData, reqPath, debug) {
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
        if (debug) console.log(chalk`{cyanBright Test used:} {white ${filePath}}`)
        try {
          delete require.cache[mockFile]
          const testFile = require(mockFile)
          if (isFunction(testFile.testData)) {
            const result = testFile.testData(reqMethod, reqData, resData, reqPath)
            if (result instanceof Promise) {
              result.then(resData => {
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
            console.warn(apiName + ' has not test method.')
            reject(false)
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
