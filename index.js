const os = require('os')
const events = require('@polyn/async-events')
const blueprint = require('@polyn/blueprint')
const immutable = require('@polyn/immutable')

// formatters
const { ConsoleStyles } = require('./src/formatters/ConsoleStyles').factory(blueprint, immutable)
const { validateFormatter } = require('./src/formatters/validate-formatter').factory(blueprint)
const { errorFormatter } = require('./src/formatters/error-formatter').factory()
const { BlockFormatter } = require('./src/formatters/BlockFormatter').factory(ConsoleStyles, errorFormatter)
const { BunyanFormatter } = require('./src/formatters/BunyanFormatter').factory(errorFormatter)
const { JsonFormatter } = require('./src/formatters/JsonFormatter').factory(errorFormatter)
const { PassThroughFormatter } = require('./src/formatters/PassThroughFormatter').factory()
const { StringFormatter } = require('./src/formatters/StringFormatter').factory(errorFormatter)

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
const { LogMetaFactory } = require('./src/LogMetaFactory').factory(blueprint, immutable, os)
const { Logger } = require('./src/Logger').factory(
  blueprint,
  immutable,
  events,
  LogMetaFactory,
  validateWriter
)

module.exports = { Logger, formatters, writers }
