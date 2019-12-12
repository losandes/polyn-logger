module.exports = {
  name: 'JsonFormatter',
  dependencies: ['error-formatter'],
  factory: (errorFormatter) => {
    'use strict'

    function JsonFormatter () {
      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        if (!log) {
          return resolve(JSON.stringify(meta))
        }

        return resolve(JSON.stringify({
          ...meta,
          ...errorFormatter.format(log),
        }))
      })

      return { format }
    }

    return { JsonFormatter }
  },
}
