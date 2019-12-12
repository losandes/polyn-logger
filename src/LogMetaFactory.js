module.exports = {
  name: 'LogMetaFactory',
  dependencies: ['@polyn/blueprint', '@polyn/immutable', 'os'],
  factory: (polynBp, polynIm, os) => {
    'use strict'

    const { optional, required } = polynBp
    const { immutable } = polynIm
    const DEFAULT_SOURCE = 'GLOBAL'

    const LogMetaFactory = (options) => {
      const { events, hostname, pid } = options
      const EVENT_EXP_STR = `^(${events.join('|')})$`
      const EVENT_EXP = new RegExp(EVENT_EXP_STR)
      const HOST_NAME = hostname || (typeof os !== 'undefined' ? os.hostname() : 'local')
      const PID = pid || (typeof process !== 'undefined' ? process.pid : 0)
      const isValidEvent = (value) => EVENT_EXP.test(value)

      return immutable('LogMetaFactory', {
        // /^(trace|debug|info|warn|error|fatal)$/
        event: required('string').from(({ value }) => {
          if (typeof value === 'string') {
            const output = value.trim()

            if (isValidEvent(output)) {
              return output
            }
          }

          throw new Error(`Invalid Event: expected ${value} to match ${EVENT_EXP_STR}`)
        }),
        source: optional('string').withDefault(DEFAULT_SOURCE),
        hostname: optional('string').withDefault(HOST_NAME),
        pid: optional('number').withDefault(PID),
      })
    }

    return { LogMetaFactory }
  },
}
