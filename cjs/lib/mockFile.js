const isFunction = require('lodash/isFunction')
function getDataFromPath (mockPath, apiName, method, params) {
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
        console.log('Mock used:', filePath)
        delete require.cache[mockFile]
        try {
          const resultFile = require(mockFile)
          if (isFunction(resultFile.getData)) {
            const result = resultFile.getData(method, params)
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
            reject(new Error(apiName + ' has not mock method.'))
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
