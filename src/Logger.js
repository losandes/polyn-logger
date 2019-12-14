module.exports = {
  name: 'LogMeta',
  dependencies: ['@polyn/blueprint', '@polyn/immutable', '@polyn/async-events', 'LogMetaFactory', 'validate-writer'],
  factory: (polynBp, polynIm, polynEv, LogMetaFactory, validateWriter) => {
    'use strict'

    const { optional } = polynBp
    const { immutable } = polynIm
    const { Topic } = polynEv

    const LoggerOptions = immutable('LoggerOptions', {
      name: optional('string').withDefault('logger'),
      events: optional('string[]').from(({ value }) => {
        if (Array.isArray(value)) {
          const values = value.map((val) => val.trim())

          if (values.includes('publish') || values.includes('emit')) {
            throw new Error('Invalid Logger Options: the following event names are protected, and cannot be configured: "publish", "emit"')
          }

          return values
        }

        return ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
      }),
      source: 'string?',
      hostname: 'string?',
      pid: 'number?',
      defaultMode: optional(/^(publish|emit)$/).withDefault('publish')
    })

    /**
     * @param input - the unsanitized input (so we can use references)
     */
    const makeOptions = (input) => {
      let logTopic, options

      if (input && input.__logTopic) {
        options = new LoggerOptions(input)
        logTopic = (input && input.__logTopic)
      } else {
        options = new LoggerOptions(input)
        logTopic = new Topic({ topic: options.name })
      }

      return { logTopic, options }
    }

    function Logger (input) {
      const { logTopic, options } = makeOptions(input)
      const withSource = (source) => new Logger({
        ...input,
        ...{
          source,
          __logTopic: logTopic, // always use the same topic, so subscriptions are respected
        },
      })
      const subscribe = (events, writer) => new Promise((resolve, reject) => {
        try {
          validateWriter({ writer })
          const receiver = (body, meta) => writer.write(body, {
            topic: meta.topic,
            id: meta.id,
            time: meta.time,
            event: meta.event,
            source: meta.source,
            hostname: meta.hostname,
            pid: meta.pid,
          })

          return logTopic.subscribe(events, receiver)
            .then(resolve)
            .catch(reject)
        } catch (e) {
          reject(e)
        }
      })
      const unsubscribe = logTopic.unsubscribe
      const LogMeta = LogMetaFactory(options)

      const _log = (action) => (event) => {
        return (...body) => action(
          event,
          body && body.length === 1 ? body[0] : body, // support multiple params, but don't muddy up single params
          new LogMeta({
            event,
            source: options.source,
          }),
        )
      }

      const log = (event, body) => _log(logTopic[options.defaultMode])(event)(body)

      options.events.forEach((event) => {
        log[event] = _log(logTopic[options.defaultMode])(event)
      })

      log.publish = (event, body) => _log(logTopic.publish)(event)(body)
      log.emit =    (event, body) => _log(logTopic.emit)(event)(body)

      return { name: options.name, withSource, subscribe, unsubscribe, log }
    }

    return { Logger }
  },
}
