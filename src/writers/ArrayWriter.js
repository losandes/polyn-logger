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
       * Writes the output to the given array
       * @param log the log to write
       */
      const write = (log, meta) => {
        return format(log, meta).then((formatted) => {
          if (history.length >= maxSize) {
            history.shift() // remove the first item in the history
          }

          history.push(formatted)
        }).then(() => { return { log, meta } })
      }

      return { history, maxSize, write }
    }

    return { ArrayWriter }
  },
}
