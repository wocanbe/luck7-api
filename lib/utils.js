module.exports.addCrosHeader = function (req, res, allowCookie) {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  if (allowCookie) {
    res.header('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild')
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
    res.sendStatus(200) // 让options请求快速返回
  } else {
    res.setHeader('Content-Type', 'application/json;charset=utf-8')
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)
  }
}

module.exports.checkOrigin = function (req, allowOrigin, safeMode) {
  const {protocol, method, headers} = req
  // get请求(没有origin)，放过
  if (method === 'GET') return false
  // 允许所有域名访问
  if (allowOrigin === true) return false

  let origin = headers.origin
  // options请求(没有referer)
  if (method === 'OPTIONS') {
    return allowOrigin.indexOf(origin) === -1
  }

  // 当host与origin一致时，认为是没跨域，但host也可以伪造
  const hostOrigin = protocol + '://' + headers.host
  if (origin === hostOrigin) {
    if (safeMode) return allowOrigin.indexOf(hostOrigin) === -1
    return !(origin === hostOrigin)
  }
  return allowOrigin.indexOf(origin) === -1
}
function getMockItem (config, path) {
  const useConfig = config.path.split('/')
  const usePath = path.split('/')
  let hasParams = true
  const params = {}
  if (useConfig[useConfig.length - 1] === '') useConfig.pop()
  if (usePath[usePath.length - 1] === '') usePath.pop()
  if (useConfig.length === usePath.length) {
    for (let i = 0; i < usePath.length; i++) {
      if (useConfig[i] !== usePath[i]) {
        if (useConfig[i].substr(0, 1) === ':') {
          params[useConfig[i].substr(1)] = usePath[i]
        } else {
          hasParams = false
          break
        }
      }
    }
  } else {
    hasParams = false
  }
  if (hasParams) return [params, config.target]
}
module.exports.getMockParams = function (configs, path) {
  for (let k = 0; k < configs.length; k++) {
    const result = getMockItem(configs[k], path)
    if (result) return result
  }
}
