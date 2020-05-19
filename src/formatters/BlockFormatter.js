module.exports = {
  name: 'BlockFormatter',
  dependencies: ['ConsoleStyles'],
  factory: (ConsoleStyles) => {
    'use strict'

    const DELIMITER = '::'
    const prettifyVerbosityFactory = (styles) => (category) => {
      switch (category) {
        case 'trace':
          return styles.bgWhite(styles.black(` ${category.toUpperCase()} `))
        case 'debug':
          return styles.bgGreen(styles.black(` ${category.toUpperCase()} `))
        case 'info':
          return styles.bgBlue(styles.black(` ${category.toUpperCase()} `))
        case 'warn':
          return styles.bgYellow(styles.black(` ${category.toUpperCase()} `))
        case 'error':
          return styles.bgRed(styles.black(` ${category.toUpperCase()} `))
        case 'fatal':
          return styles.bgMagenta(styles.black(` ${category.toUpperCase()} `))
        default:
          return styles.bgWhite(styles.black(` ${category.toUpperCase()} `))
      }
    }

    const makeDetails = (log) => log
    // {
    //   if (!log) {
    //     return log
    //   }
    //
    //   const clone = errorFormatter.format(log)
    //   return typeof clone !== 'object' ? { message: clone } : clone
    // }

    function BlockFormatter (options) {
      const { consoleStyles } = new ConsoleStyles(options)
      const prettifyVerbosity = prettifyVerbosityFactory(consoleStyles)

      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        const entryParts = meta.category === meta.event
          ? [prettifyVerbosity(meta.category), meta.time, meta.source]
          : [prettifyVerbosity(meta.category), meta.event, meta.time, meta.source]

        return resolve({
          entry: entryParts.join(DELIMITER),
          details: makeDetails(log),
        })
      })

      return { format }
    }

    return { BlockFormatter }
  },
}
