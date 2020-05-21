module.exports = {
  name: 'ConsoleWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function ConsoleWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to the console (Logger)
       * @param {any} log - the log to write
       * @param {LogMeta} meta - the log metadata
       */
      const write = (log, meta) => format(log, meta)
        .then((formatted) =>
          console.dir(formatted, { depth: null }), // eslint-disable-line no-console
        ).then(() => { return { log, meta } })

      /**
       * Writes the output to the console (LogEmitter)
       * @param {LogMeta} meta - the log metadata
       * @param {any} args - log(s) to write
       */
      const listen = (meta, ...args) => write(
        args && args.length === 1 ? args[0] : args, meta
      )

      return { write, listen }
    }

    return { ConsoleWriter }
  },
}
