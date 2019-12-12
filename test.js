const { expect } = require('chai')
const supposed = require('supposed')
const { Logger, formatters, writers } = require('@polyn/logger')

module.exports = supposed.Suite({
  name: 'polyn-logger',
  assertionLibrary: expect,
  inject: {
    Logger,
    formatters,
    writers,
  },
}).runner()
  .run()
