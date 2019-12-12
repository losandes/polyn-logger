module.exports = {
  name: 'StringFormatter',
  dependencies: ['error-formatter'],
  factory: (errorFormatter) => {
    'use strict'

    const DELIMITER = '::'

    function StringFormatter () {
      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        let message

        if (errorFormatter.isError(log)) {
          message = `${log.message}::\n    ${log.stack}`
        } else if (typeof log !== 'object') {
          message = log
        } else if (log) {
          message = JSON.stringify(errorFormatter.format(log))
        }

        // remove line breaks
        message = typeof message === 'string' ? message.replace(/\n/g, '\\n').replace(/\r/g, '\\r') : ''
        return resolve([
          meta.event.toUpperCase(),
          meta.time,
          meta.source,
          message,
        ].join(DELIMITER))
      })

      return { format }
    }

    return { StringFormatter }
  },
}
