module.exports = {
  name: 'JsonFormatter',
  dependencies: ['@polyn/blueprint', 'error-formatter'],
  factory: (polynBp, errorFormatter) => {
    'use strict'

    const { is } = polynBp

    function JsonFormatter () {
      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        if (!log) {
          return resolve(JSON.stringify(meta))
        }

        let _log

        if (is.primitive(log)) {
          _log = { log: log }
        } else if (Array.isArray(log)) {
          _log = { log: errorFormatter.format(log) }
        } else {
          _log = errorFormatter.format(log)
        }

        return resolve(JSON.stringify({
          ...meta,
          ..._log,
        }))
      })

      return { format }
    }

    return { JsonFormatter }
  },
}
