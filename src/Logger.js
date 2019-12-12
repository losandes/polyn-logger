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
          return value.map((val) => val.trim())
        }

        return ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
      }),
      source: 'string?',
      hostname: 'string?',
      pid: 'number?',
    })

    function Logger (input) {
      const options = new LoggerOptions(input)
      const logTopic = (input && input.__logTopic) || new Topic({ topic: options.name })

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

      const _log = (event) => {
        return (...body) => logTopic.publish(
          event,
          body && body.length === 1 ? body[0] : body, // support multiple params, but don't muddy up single params
          new LogMeta({
            event,
            source: options.source,
          }),
        )
      }

      const log = (event, body) => _log(event)(body)

      options.events.forEach((event) => {
        log[event] = _log(event)
      })

      return { name: options.name, withSource, subscribe, unsubscribe, log }
    }

    return { Logger }
  },
}
