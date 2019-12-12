module.exports = {
  name: 'DevConsoleWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function DevConsoleWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to console.log
       * @param log the log to write
       */
      const write = (log, meta) => {
        return format(log, meta)
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
      }

      return { write }
    }

    return { DevConsoleWriter }
  },
}
