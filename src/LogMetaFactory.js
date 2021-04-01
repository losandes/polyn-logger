/**
 * @param {@polyn/blueprint} blueprint
 * @param {@polyn/immutable} immutable
 * @param {os} os
 */
function LogMetaFactory (deps) {
  'use strict'

  const { optional, required } = deps.blueprint
  const { immutable } = deps.immutable
  const { os } = deps

  const LogMetaFactory = (options) => {
    const { events, hostname, pid } = options
    const EVENT_EXP_STR = Array.isArray(events) ? `^(${events.join('|')})$` : /^[A-Za-z0-9_.]$/
    const EVENT_EXP = new RegExp(EVENT_EXP_STR)
    const DEFAULT_SOURCE = 'GLOBAL'
    const HOST_NAME = hostname || (typeof os !== 'undefined' ? os.hostname() : 'local')
    const PID = pid || (typeof process !== 'undefined' ? process.pid : 0)
    const isValidEvent = typeof options.isValidEvent === 'function'
      ? options.isValidEvent
      : (value) => EVENT_EXP.test(value)
    const levels = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60,
    }

    return immutable('LogMetaFactory', {
      event: 'string',
      // event: /^(trace|debug|info|warn|error|fatal)$/
      category: required('string').from(({ value, input }) => {
        const val = value || input.event

        if (typeof val === 'string') {
          const output = val.trim()

          if (isValidEvent(output)) {
            return output
          }
        }

        throw new Error(`Invalid Event: expected ${value} to match ${EVENT_EXP_STR}`)
      }),
      level: required('number').from(({ output }) =>
        typeof levels[output.category] === 'number' ? levels[output.category] : 10,
      ),
      source: optional('string').withDefault(DEFAULT_SOURCE),
      hostname: optional('string').withDefault(HOST_NAME),
      pid: optional('number').withDefault(PID),
      time: required('number').from(({ value }) => value || Date.now()),
      context: 'object?',
    })
  }

  return { LogMetaFactory }
}

module.exports = LogMetaFactory
