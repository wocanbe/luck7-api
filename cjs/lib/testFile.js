'use strict'
const isFunction = require('lodash/isFunction')
const isString = require('lodash/isString')

function getDataFromPath (mockPath, apiName, reqMethod, reqData, resData) {
  return new Promise((resolve, reject) => {
    if (apiName) {
      const filePath = mockPath + apiName
      let mockFile
      try {
        mockFile = require.resolve('../../../../' + filePath)
      } catch (e) {
        reject(false)
      }
      if (mockFile) {
        console.log('Test used:', filePath)
        delete require.cache[mockFile]
        try {
          const testFile = require(mockFile)
          if (isFunction(testFile.testData)) {
            const result = testFile.testData(reqMethod, reqData, resData)
            if (result instanceof Promise) {
              result.then((resData) => {
                resolve(resData)
              }).catch(e => {
                reject(e)
              })
            } else {
              if (isString(result)) {
                resolve(result)
              } else {
                reject(result)
              }
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
