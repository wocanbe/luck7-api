# a api middleware

## demo
```javascript
  var express = require('express')
  var bodyParser = require('body-parser')
  var apiMiddleware = require('luck7-api')

  var app = express()
  /* 如果你要接收POST、PUT、DELETE请求的参数，必须使用bodyParser处理 */
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  const apiConfig = [{
    path:'/subject/:userId',
    target:'/userInfo'
  },
  {
    path:'/demo/:id',
    target:'/demo'
  }]
  // 模拟模式
  app.use(apiMiddleware({
    mode: 'mock',
    path: '/mock',
    rules: apiConfig,
    config: {
      allowOrigin: ['http://test.liuying.com'],
      // crosCookie: true,
      // safeMode: false
    }
  }))
  // 代理模式
  app.use(apiMiddleware({
    mode: 'proxy',
    path: '/api',
    rules: [{
      path: '/api',
      target: '/mock' // '/pobsFo'
    }],
    config: {
      target: 'http://localhost:8090', // http://28.5.23.161:8083
      // changeOrigin: true
    }
  }))
  // 测试模式
  app.use(apiMiddleware({
    mode: 'test',
    path: '/test',
    rules: {
      test: mockConfig,
      proxy: [{
        path: '/test',
        target: '/mock'
      }]
    },
    config: {
      target: 'http://localhost:8090'
    }
  }))
  server = app.listen(3000)
```

## api demo
```javascript
const Schema = require('async-validator')
exports.getData = function(method, data){
  return new Promise((resolve, reject) => {
    resolve(JSON.stringify({
      code: 0,
      msg: '请求方法是：' + method + '传递的参数有：' + JSON.stringify(data)
    }))
  })
}
const reqRule = {
  id: {required: true, message: '缺少ID'}
}
const resRule = {
  response: {
    type: 'array',
    required: true,
    defaultField: {
      type: 'object',
      fields: {
        name: {required: true, message: '缺少姓名'},
        age: [
          {type: 'number', message: '年龄类型错误'},
          {type: 'number', required: true, message: '缺少年龄'}
        ]
      }
    }
  }
}
exports.testData = function (method, reqData, resData) {
  const reqValid = new Schema(reqRule)
  const resValid = new Schema(resRule)
  return new Promise((resolve, reject) => {
    let validStatus = false
    reqValid.validate(reqData, (errors, fields) => {
      if (errors) validStatus = errors
    })
    if (validStatus) {
      reject(new Error('请求参数错误:' + JSON.stringify(validStatus)))
    } else {
      resValid.validate(
        {response: resData}, // 注意：async-validator必须制定item
        (errors, fields) => {
          if (errors) validStatus = errors
        }
      )
      if (validStatus) {
        reject(new Error('返回参数错误:' + JSON.stringify(validStatus)))
      } else {
        resolve(resData)
      }
    }
  })
}
```

注意：

 - getData和testData可以返回Promise,Number(将作为错误码返回给用户),string(作为结果返回)
 - 其他情况，getData将返回404，testData返回resData的值
