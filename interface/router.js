const MockInterface = require('./mock.js')
const ProxyInterface = require('./proxy')
const TestInterface = require('./test')

class Router {
  constructor (config) {
    switch (config.mode) {
      case 'mock':
        this.interface = new MockInterface(config.path, config.rules, config.config)
        break
      case 'proxy':
        this.interface = new ProxyInterface(config.path, config.rules, config.config)
        break
      case 'test':
        this.interface = new TestInterface(config.path, config.rules, config.config)
        break
      default:
        throw new Error('unknown mode' + config.mode)
    }
  }
  run () {
    return this.interface.run
  }
}

module.exports = Router
