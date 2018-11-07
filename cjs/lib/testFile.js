'use strict'
const isFunction = require('lodash/isFunction')

function getDataFromPath (mockPath, apiName, reqMethod, reqData, resData) {
  return new Promise((resolve, reject) => {
    if (apiName) {
      const filePath = mockPath + apiName
      let mockFile
      try {
        mockFile = require.resolve('../../../../' + filePath)
      } catch (e) {
        reject(new Error('Status 404'))
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
              resolve(result)
            }
          } else {
            reject(new Error(apiName + ' has not test method.'))
          }
        } catch (e) {
          console.error(e.stack)
          reject(new Error(apiName + ' has errors,please check the code.'))
        }
      }
    } else {
      reject(new Error('Status 404'))
    }
  })
}

module.exports = getDataFromPath
