# luck7-api

一个不错的进行数据模拟、校验的express中间件。
对数据的模拟和校验，使用了尽量贴近真实情况的模式，会发起真实的请求，也有真实的返回。

## 配合express进行数据模拟、校验

### express配置

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
      // mockPath: 'mock',
      // crosCookie: true,
      // safeMode: false,
      // prefetch: res => Mock(res), 可以对返回数据进行拦截统一处理
      // allowHeader: 'token' 跨域请求允许添加自定义header头
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

### 模拟文件配置
```javascript
const Schema = require('async-validator')
exports.getData = function(method, data, reqPath){
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
exports.testData = function (method, reqData, resData, reqPath) {
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
 - 模拟模式支持js和json两种模拟数据文件，测试模式只支持js文件
 
 模拟文件路径和名称规则为``${path}.js``、``${path}.json``或者``${path}_${method}.json``

 - 使用js作为模拟数据文件时，需要实现getData和testData(测试模式)方法，方法可以返回任意类型(包含Promise)
 - getData返回数据为以下两种情况时，将作为错误处理
  - Error类型对象，返回500，信息内容为e.message
  - [number,string]格式的数组，返回状态为array[0],信息内容为array[1]
 - 
## 配合vue-cli4.X使用

你是否有经历过明明跟后端约定的字段类型是字符串，临近测试，后端用了时间戳，吵不过回去默默的在一大堆逻辑中查找修改代码，用了luck7-api，你可以自由的在代理模式和校验模式切换，在后端修改接口的第一时间发现，及时修改代码。
配置示例:
```js
module.exports = {
  // ...
  // webpack-dev-server 相关配置
  devServer: {
    // 模拟数据开始
    before (app) {
      app.get('/api/seller', (req, res) => {
        res.json({
          // 这里是你的json内容
          errno: 0,
          data: seller
        })
      })
    }   
  }
}
```


