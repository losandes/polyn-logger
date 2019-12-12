const { expect } = require('chai')
const supposed = require('supposed')
const {
  Logger,
  formatters: {
    BlockFormatter,
    BunyanFormatter,
    JsonFormatter,
    PassThroughFormatter,
    StringFormatter,
  },
  writers: {
    ArrayWriter,
    ConsoleWriter,
    DevConsoleWriter,
    StdoutWriter,
  }
} = require('.')

module.exports = supposed.Suite({
  name: 'polyn-logger',
  assertionLibrary: expect,
  inject: {
    Logger,
    formatters,
    writers,  
  }
}).runner()
  .run()
