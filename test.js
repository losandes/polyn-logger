const { expect } = require('chai')
const supposed = require('supposed')
const { Logger, LogEmitter, formatters, writers } = require('@polyn/logger')

module.exports = supposed.Suite({
  name: 'polyn-logger',
  assertionLibrary: expect,
  inject: {
    Logger,
    LogEmitter,
    formatters,
    writers,
  },
}).runner()
  .run()
