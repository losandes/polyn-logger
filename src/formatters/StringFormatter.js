module.exports = {
  name: 'StringFormatter',
  dependencies: ['@polyn/blueprint', 'error-formatter'],
  factory: (polynBp, errorFormatter) => {
    'use strict'

    const { is } = polynBp
    const DELIMITER = '::'

    function StringFormatter () {
      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        let message = ''

        if (is.primitive(log)) {
          message = log
        } else if (log) {
          message = JSON.stringify(errorFormatter.format(log))
        }

        // remove line breaks
        message = typeof message === 'string' ? message.replace(/\n/g, '\\n').replace(/\r/g, '\\r') : ''
        const parts = meta.category === meta.event
          ? [meta.category.toUpperCase(), meta.time, meta.source, message]
          : [meta.category.toUpperCase(), meta.event, meta.time, meta.source, message]

        return resolve(parts.join(DELIMITER))
      })

      return { format }
    }

    return { StringFormatter }
  },
}
