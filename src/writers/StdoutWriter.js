module.exports = {
  name: 'StdoutWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function StdoutWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to console.log
       * @param log the log to write
       */
      const write = (log, meta) => {
        return format(log, meta).then((formatted) =>
          process.stdout.write(`${formatted}\n`), // eslint-disable-line no-console
        ).then(() => { return { log, meta } })
      }

      return { write }
    }

    return { StdoutWriter }
  },
}
