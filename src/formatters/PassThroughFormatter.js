module.exports = {
  name: 'PassThroughFormatter',
  dependencies: [],
  factory: () => {
    'use strict'

    function PassThroughFormatter () {
      return {
        /**
         * Formats the output
         * @param log the log to format
         */
        format: (log, meta) => Promise.resolve({ log, meta }),
      }
    }

    return { PassThroughFormatter }
  },
}
