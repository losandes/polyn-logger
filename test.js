const { expect } = require('chai')
const supposed = require('supposed')
const polynLogger = require('@polyn/logger')

module.exports = supposed.Suite({
  name: 'polyn-logger',
  assertionLibrary: expect,
  inject: polynLogger,
}).runner()
  .run()
