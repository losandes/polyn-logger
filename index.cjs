const EventEmitter = require('events')
const os = require('os')
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
const { SquashFormatter } = require('./src/formatters/SquashFormatter')({ blueprint })

const formatters = {
  BlockFormatter,
  BunyanFormatter,
  JsonFormatter,
  PassThroughFormatter,
  StringFormatter,
  SquashFormatter,
}

// writers
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

// middleware / utils
const { makeId } = require('./src/make-id')()
const time = require('./src/time')()
const { makeTryWithMetrics, METRICS_CATEGORIES } = require('./src/try-with-metrics')({
  blueprint,
  immutable,
  makeId,
  time,
})

// logger
const { LogMetaFactory } = require('./src/LogMetaFactory')({ blueprint, immutable, os })
const { LogEmitter } = require('./src/LogEmitter')({
  blueprint,
  immutable,
  EventEmitter,
  LogMetaFactory,
  makeTryWithMetrics,
})

module.exports = {
  formatters,
  writers,
  LogEmitter,
  METRICS_CATEGORIES,
}
