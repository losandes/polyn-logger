module.exports = (test, dependencies) => {
  'use strict'

  const {
    Logger,
    formatters,
    writers
  } = dependencies

  const {
    BlockFormatter,
    BunyanFormatter,
    JsonFormatter,
    PassThroughFormatter,
    StringFormatter,
  } = formatters

  const {
    ArrayWriter,
    ConsoleWriter,
    DevConsoleWriter,
    StdoutWriter,
  } = writers

  return test('given @polyn/logger', {

  })
}
