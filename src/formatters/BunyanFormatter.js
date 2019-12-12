/**
 * A bunyan compatible formatter, so you can pipe the output to Bunyan if necessary
 */
module.exports = {
  name: 'BunyanFormatter',
  dependencies: ['error-formatter'],
  factory: (errorFormatter) => {
    'use strict'

    function BunyanFormatter (events) {
      let levels

      if (Array.isArray(events)) {
        levels = {}
        let current = 60

        /*
         * starts at the max level, and works down to 10
         * ['local2', 'local', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
         *   =>
         * ['trace',  'trace', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
         * [10,       10,      10,      20,      30,     40,     50,      60]
         */
        for (let i = events.length - 1; i >= 0; i -= 1) {
          levels[events[i]] = current

          if (current > 10) {
            current -= 10
          }
        }
      } else if (events) {
        levels = events
      } else {
        levels = {}
      }

      const getLevel = (event) => {
        const level = levels[event]

        return typeof level === 'number' ? level : 30
      }

      /**
       * Formats the output
       * @param log the log to format
       */
      const format = (log, meta) => new Promise((resolve) => {
        return resolve(JSON.stringify({
          v: 2,
          level: getLevel(meta.event),
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
