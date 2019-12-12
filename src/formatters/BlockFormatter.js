module.exports = {
  name: 'BlockFormatter',
  dependencies: ['ConsoleStyles', 'error-formatter'],
  factory: (ConsoleStyles, errorFormatter) => {
    'use strict'

    const DELIMITER = '::'
    const prettifyVerbosityFactory = (styles) => (event) => {
      switch (event) {
        case 'trace':
          return styles.bgWhite(styles.black(` ${event.toUpperCase()} `))
        case 'debug':
          return styles.bgGreen(styles.black(` ${event.toUpperCase()} `))
        case 'info':
          return styles.bgBlue(styles.black(` ${event.toUpperCase()} `))
        case 'warn':
          return styles.bgYellow(styles.black(` ${event.toUpperCase()} `))
        case 'error':
          return styles.bgRed(styles.black(` ${event.toUpperCase()} `))
        case 'fatal':
          return styles.bgMagenta(styles.black(` ${event.toUpperCase()} `))
        default:
          return styles.bgWhite(styles.black(` ${event.toUpperCase()} `))
      }
    }

    const makeDetails = (log) => {
      if (!log) {
        return log
      }

      const clone = errorFormatter.format(log)
      return typeof clone !== 'object' ? { message: clone } : clone
    }

    function BlockFormatter (options) {
      const { consoleStyles } = new ConsoleStyles(options)
      const prettifyVerbosity = prettifyVerbosityFactory(consoleStyles)

      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        return resolve({
          entry: [prettifyVerbosity(meta.event), meta.time, meta.source].join(DELIMITER),
          details: makeDetails(log),
        })
      })

      return { format }
    }

    return { BlockFormatter }
  },
}
