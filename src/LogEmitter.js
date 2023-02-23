/**
 * @param {{
 *   blueprint: import('@polyn/blueprint')
 *   immutable: import('@polyn/immutable')
 *   LogMetaFactory: import('..').LogMetaFactory
 *   EventEmitter: import('events')
 *   makeTryWithMetrics: function
 * }} dependencies
 */
function LogEmitterFactory (dependencies) {
  'use strict'

  const { optional } = dependencies.blueprint
  const { immutable } = dependencies.immutable
  const { LogMetaFactory, EventEmitter, makeTryWithMetrics } = dependencies
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
    constructor (options) {
      super(options)
      this.options = new LogEmitterOptions(options)
      this.LogMeta = LogMetaFactory({
        ...{ isValidEvent: () => true },
        ...this.options,
      })
      this.tryWithMetrics = makeTryWithMetrics({
        ...options,
        ...{ emitter: this },
      })

      /**
       * NodeJS' EventEmitter throws an Error if you emit 'error',
       * and there are no subscriptions to 'error'. This doesn't
       * make sense for a logger, so this noop circumvents that.
       */
      this.on('error', () => {})
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
