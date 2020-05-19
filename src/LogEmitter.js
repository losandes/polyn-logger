/**
 * @param {@polyn/blueprint} blueprint
 * @param {@polyn/immutable} immutable
 * @param {LogMetaFactory} LogMetaFactory
 * @param {events} EventEmitter
 */
function LogEmitterFactory (deps) {
  'use strict'

  const { optional } = deps.blueprint
  const { immutable } = deps.immutable
  const { LogMetaFactory, EventEmitter } = deps
  const TAB_AT_EXP = /^(\s+)at /

  const LogEmitterOptions = immutable('LogEmitterOptions', {
    source: 'string?',
    hostname: 'string?',
    pid: 'number?',
    wildcardEvent: optional('string').withDefault('*'),
    noListenersEvent: optional('string').withDefault('no_listeners'),
    context: 'object?',
  })

  class LogEmitter extends EventEmitter {
    constructor (input) {
      super(input)
      this.options = new LogEmitterOptions(input)
      this.LogMeta = LogMetaFactory({
        ...{ isValidEvent: () => true },
        ...this.options,
      })
    }

    __emitWith (meta, ...args) {
      const events = meta.event === meta.category
        ? [meta.event, this.options.wildcardEvent]
        : [meta.event, meta.category, this.options.wildcardEvent]

      return events
        .map((a) => super.emit(a, meta, ...args))
        .includes(true) ||
        super.emit(this.options.noListenersEvent, meta, ...args)
    }

    emit (event, category, ...args) {
      const meta = new this.LogMeta({
        event,
        category,
        context: this.options.context,
        source: (() => {
          const stack = new Error().stack
          const lines = stack.split('\n')

          for (let i = 1; i < lines.length; i += 1) {
            if (!lines[i].includes('LogEmitter.js')) {
              return lines[i].replace(TAB_AT_EXP, '')
            }
          }
        })(),
      })

      return this.__emitWith(meta, ...args)
    }

    pipe () {
      return (meta, ...args) => this.__emitWith(meta, ...args)
    }

    child (options) {
      const emitter = new LogEmitter(options)
      emitter.on(this.options.wildcardEvent, this.pipe())
      return emitter
    }
  }

  return { LogEmitter }
}

module.exports = LogEmitterFactory
