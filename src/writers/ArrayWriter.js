module.exports = {
  name: 'ArrayWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function ArrayWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter
      const { history, maxSize } = { ...{ history: [], maxSize: 100 }, ...options }

      /**
       * Writes the output to an array (Logger)
       * @param {any} log - the log to write
       * @param {LogMeta} meta - the log metadata
       */
      const write = (log, meta) => format(log, meta)
        .then((formatted) => {
          if (history.length >= maxSize) {
            history.shift() // remove the first item in the history
          }

          history.push(formatted)
        }).then(() => { return { log, meta } })

      /**
       * Writes the output to an array (LogEmitter)
       * @param {LogMeta} meta - the log metadata
       * @param {any} args - log(s) to write
       */
      const listen = (meta, ...args) => write(
        args && args.length === 1 ? args[0] : args, meta
      )

      return { history, maxSize, write, listen }
    }

    return { ArrayWriter }
  },
}
