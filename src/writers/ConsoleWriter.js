module.exports = {
  name: 'ConsoleWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function ConsoleWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to console.log
       * @param log the log to write
       */
      const write = (log, meta) => {
        return format(log, meta).then((formatted) =>
          console.dir(formatted, { depth: null }), // eslint-disable-line no-console
        ).then(() => { return { log, meta } })
      }

      return { write }
    }

    return { ConsoleWriter }
  },
}
