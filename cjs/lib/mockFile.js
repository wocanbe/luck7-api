const chalk = require('chalk')
const isFunction = require('lodash/isFunction')
const isArray = require('lodash/isArray')
const isNumber = require('lodash/isNumber')
const isString = require('lodash/isString')

function jsMock (mockFile, filePath, method, params, resolve, reject, reqPath) { // mockPath, apiName, method, params, debug
  try {
    delete require.cache[mockFile]
    const resultFile = require(mockFile)
    if (isFunction(resultFile.getData)) {
      const result = resultFile.getData(method, params, reqPath)
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
      reject(new Error(`${filePath} has not mock method.`))
    }
  } catch (e) {
    console.error(e.stack)
    reject(new Error(`${filePath} has errors,please check the code.`))
  }
}
function jsonMock (mockFile, filePath, resolve, reject) {
  try {
    delete require.cache[mockFile]
    const result = require(mockFile)
    resolve(result)
  } catch (e) {
    console.error(e.stack)
    reject(new Error(`${filePath} has errors,please check the code.`))
  }
}
function getDataFromPath (mockPath, apiName, method, params, reqPath, debug) {
  return new Promise((resolve, reject) => {
    if (apiName) {
      const filePath = mockPath + apiName
      let mockFile,xdMockFile
      try {
        xdMockFile = filePath + '.js'
        mockFile = require.resolve(process.cwd() + '/' + xdMockFile)
        if (mockFile) {
          if (debug) console.log(chalk`{cyanBright Mock used:} {white ${xdMockFile}}`)
          jsMock(mockFile, xdMockFile, method, params, resolve, reject, reqPath)
        }
      } catch (e) {
        try {
          const jsonPath = filePath+'_'+method.toLowerCase()
          xdMockFile = jsonPath + '.json'
          mockFile = require.resolve(process.cwd() + '/' + xdMockFile)
          if (mockFile) {
            if (debug) console.log(chalk`{cyanBright Mock used:} {white ${xdMockFile}}`)
            jsonMock(mockFile, xdMockFile, resolve, reject)
          }
        } catch (e) {
          try {
            xdMockFile = filePath + '.json'
            mockFile = require.resolve(process.cwd() + '/' + xdMockFile)
            if (mockFile) {
              if (debug) console.log(chalk`{cyanBright Mock used:} {white ${xdMockFile}}`)
              jsonMock(mockFile, xdMockFile, resolve, reject)
            }
          } catch (e) {
            // can't found mock file
            reject(false)
          }
        }
      }
    } else {
      reject(false)
    }
  })
}

module.exports = getDataFromPath
