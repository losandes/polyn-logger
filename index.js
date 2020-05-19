const EventEmitter = require('events')
const os = require('os')
const asyncEvents = require('@polyn/async-events')
const blueprint = require('@polyn/blueprint')
const immutable = require('@polyn/immutable')

// formatters
const { ConsoleStyles } = require('./src/formatters/ConsoleStyles').factory(blueprint, immutable)
const { validateFormatter } = require('./src/formatters/validate-formatter').factory(blueprint)
const { errorFormatter } = require('./src/formatters/error-formatter').factory(blueprint)
const { BlockFormatter } = require('./src/formatters/BlockFormatter').factory(ConsoleStyles)
const { BunyanFormatter } = require('./src/formatters/BunyanFormatter').factory(errorFormatter)
const { JsonFormatter } = require('./src/formatters/JsonFormatter').factory(blueprint, errorFormatter)
const { PassThroughFormatter } = require('./src/formatters/PassThroughFormatter').factory()
const { StringFormatter } = require('./src/formatters/StringFormatter').factory(blueprint, errorFormatter)

const formatters = {
  BlockFormatter,
  BunyanFormatter,
  JsonFormatter,
  PassThroughFormatter,
  StringFormatter,
}

// writers
const { validateWriter } = require('./src/writers/validate-writer').factory(blueprint)
const { ArrayWriter } = require('./src/writers/ArrayWriter').factory(validateFormatter)
const { ConsoleWriter } = require('./src/writers/ConsoleWriter').factory(validateFormatter)
const { DevConsoleWriter } = require('./src/writers/DevConsoleWriter').factory(validateFormatter)
const { StdoutWriter } = require('./src/writers/StdoutWriter').factory(validateFormatter)

const writers = {
  ArrayWriter,
  ConsoleWriter,
  DevConsoleWriter,
  StdoutWriter,
}

// logger
const { LogMetaFactory } = require('./src/LogMetaFactory')({ blueprint, immutable, os })
const { Logger } = require('./src/Logger')({
  blueprint,
  immutable,
  asyncEvents,
  LogMetaFactory,
  validateWriter,
})
const { LogEmitter } = require('./src/LogEmitter')({
  blueprint,
  immutable,
  EventEmitter,
  LogMetaFactory,
})

module.exports = { Logger, formatters, writers, LogEmitter }
