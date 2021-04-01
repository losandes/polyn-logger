module.exports = {
  name: 'StdoutWriter',
  dependencies: ['validate-formatter'],
  factory: (validateFormatter) => {
    'use strict'

    function StdoutWriter (options) {
      validateFormatter(options)
      const { format } = options.formatter

      /**
       * Writes the output to an array (Logger)
       * @param {any} log - the log to write
       * @param {LogMeta} meta - the log metadata
       */
      const write = (log, meta) => format(log, meta)
        .then((formatted) =>
          process.stdout.write(`${formatted}\n`), // eslint-disable-line no-console
        ).then(() => { return { log, meta } })

      /**
       * Writes the output to an array (LogEmitter)
       * @param {LogMeta} meta - the log metadata
       * @param {any} args - log(s) to write
       */
      const listen = (meta, ...args) => write(
        args && args.length === 1 ? args[0] : args, meta,
      )

      return { write, listen }
    }

    return { StdoutWriter }
  },
}
