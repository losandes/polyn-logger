/**
 * A bunyan compatible formatter, so you can pipe the output to Bunyan if necessary
 */
module.exports = {
  name: 'BunyanFormatter',
  dependencies: ['error-formatter'],
  factory: (errorFormatter) => {
    'use strict'

    function BunyanFormatter (events) {
      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        return resolve(JSON.stringify({
          v: 2,
          level: meta.level,
          name: meta.topic,
          hostname: meta.hostname,
          pid: meta.pid,
          time: new Date(meta.time).toISOString(),
          msg: log ? JSON.stringify(errorFormatter.format(log)) : meta.event,
          src: {
            file: meta.source,
            line: 0,
            func: '',
          },
        })) // /resolve
      })

      return { format }
    }

    return { BunyanFormatter }
  },
}
