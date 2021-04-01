module.exports = {
  name: 'DevConsoleWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function DevConsoleWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to the console (Logger)
       * @param {any} log - the log to write
       * @param {LogMeta} meta - the log metadata
       */
      const write = (log, meta) => format(log, meta)
        .then((_log) => {
          /* eslit-disable no-console */
          if (_log.entry && _log.details) {
            console.log(_log.entry)
            console.dir(_log.details, { depth: null })
          } else if (_log.entry) {
            console.log(_log.entry)
          } else {
            console.dir(_log, { depth: null })
          }
          /* eslit-enable no-console */
        })
        .then(() => { return { log, meta } })

      /**
       * Writes the output to the console (LogEmitter)
       * @param {LogMeta} meta - the log metadata
       * @param {any} args - log(s) to write
       */
      const listen = (meta, ...args) => write(
        args && args.length === 1 ? args[0] : args, meta,
      )

      return { write, listen }
    }

    return { DevConsoleWriter }
  },
}
