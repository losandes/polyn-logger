const { Logger, formatters, writers } = require('@polyn/logger')
const {
  BlockFormatter,
  BunyanFormatter,
  JsonFormatter,
  PassThroughFormatter,
  StringFormatter,
} = formatters
const {
  ArrayWriter,
  ConsoleWriter,
  DevConsoleWriter,
  StdoutWriter,
} = writers

const arrayWriter = new ArrayWriter({ formatter: new StringFormatter() })
const customWriter = () => {
  return {
    write: async (log, meta) => {
      // format the log

      // write the log
      console.log('CUSTOM:', log, meta)
    },
  }
}
const _writers = [
  /* 0 */ new DevConsoleWriter({ formatter: new BlockFormatter() }),
  /* 1 */ new DevConsoleWriter({ formatter: new BlockFormatter({ useColors: false }) }),
  /* 2 */ new ConsoleWriter({ formatter: new PassThroughFormatter() }),
  /* 3 */ new StdoutWriter({ formatter: new StringFormatter() }),
  /* 4 */ new StdoutWriter({ formatter: new JsonFormatter() }),
  /* 5 */ (events) => new StdoutWriter({ formatter: new BunyanFormatter(events) }),
  /* 6 */ arrayWriter,
  /* 7 */ customWriter(),
]

// standard fare
;(async () => {
  try {
    const events = [
      'local',
      'local2',
      'trace',
      'trace2',
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]
    const logger = new Logger({ events, defaultMode: 'emit' })
    await logger.subscribe([
      'local',
      'local2',
      'trace',
      'trace2',
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ], _writers[0])
    // setTimeout(() => { console.log(arrayWriter.history) }, 100)

    const writeLogs = async ({ log }) => {
      await log('local', { hello: 'log(local)' })
      await log('local2', { hello: 'log(local2)' })
      await log('trace', { hello: 'log(trace)' })
      await log('trace2')
      await log('debug', { hello: 'log(debug)' })
      await log('info', { hello: 'log(info)' })
      await log('warn', { hello: 'log(warn)' })
      await log('error', new Error('log(error!)'))
      await log('fatal', new Error('log(fatal!)'))
      await log.local({ hello: 'log.local' })
      await log.local2({ hello: 'log.local2' })
      await log.trace({ hello: 'log.trace' })
      await log.debug({ hello: 'log.debug' })
      await log.info({ hello: 'log.info' })
      await log.warn({ hello: 'log.warn' })
      await log.error({ err: new Error('log.error!') })
      await log.fatal({ err: new Error('log.fatal!') })
    }

    await writeLogs(logger.withSource('@polyn/logger README 1'))
    await writeLogs(logger.withSource('@polyn/logger README 2'))
  } catch (e) {
    console.log('test.manual', e)
  }
})()

// multiple parameters, and parameter types
;(async () => {
  // the events this instance will support
  const events = ['foo', 'bar', 'str', 'more', 'err']

  const logger = new Logger({ name: 'my-app', events })
  await logger.subscribe(events, _writers[0]) // _writers[5](events))
  // setTimeout(() => { console.log(arrayWriter.history) }, 100)

  const test = async ({ log }) => {
    // we can emit logs using NodeJS' EventEmitter convention
    await log('foo', { hello: 'foo' })
    await log('bar', { hello: 'bar' })
    await log('str', 'message here')
    await log('more', 'message', 9, true, { details: 42 }, new Error('boom')) // multiple args are emitted as an array
    await log('err', new Error('BOOM!'))

    // the events that we set on the log options are dynamically
    // added to the `log` function
    await log.foo({ hello: 'foo' })
    await log.bar({ hello: 'bar' })
    await log.str('message here')
    await log.more('message', ...[2, false, { details: 42 }, new Error('boom')]) // multiple args are emitted as an array
    await log.err({ foo: 'bar', err: new Error('BOOM2!') })
  }

  test(logger.withSource(__filename))
  test(logger.withSource('two'))
})()

// publish / emit
;(async () => {
  try {
    const logger = new Logger({ name: 'publish/emit', events: ['info'] })
    await logger.subscribe(['info'], _writers[0])
    const { log } = logger.withSource('publish/emit')

    log.publish('info', { hello: 'publish:info' })
    log.emit('info', { hello: 'emit:info' })
  } catch (e) {
    console.log('test.manual/publish-emit', e)
  }
})()

// metrics: counts & gauges
;(async () => {
  const countWriter = () => {
    const counts = {}

    return {
      getCount: (name) => counts[name],
      write: async (log, meta) => {
        counts[log.name] = counts[log.name] || { name: log.name, count: 0 }
        counts[log.name].count += 1
      },
    }
  }

  const gaugeWriter = () => {
    const gauges = {}

    return {
      getGauge: (name) => { return gauges[name] },
      write: async (log, meta) => {
        if (meta.event === 'gauge:increase') {
          gauges[log.name] = gauges[log.name] || { name: log.name, gauge: 0 }
          gauges[log.name].gauge += 1
        } else if (meta.event === 'gauge:decrease') {
          gauges[log.name] = gauges[log.name] || { name: log.name, gauge: 1 }
          gauges[log.name].gauge -= 1
        }
      },
    }
  }

  // the events this instance will support
  const events = [
    'count',
    'gauge:increase', 'gauge:decrease',
    'metrics',
  ]
  const logger = new Logger({ name: 'my-app', events })
  const { log } = logger.withSource(__filename)

  const counts = countWriter()
  const gauges = gaugeWriter()

  ;(async () => {
    await logger.subscribe(['count'], counts)
    await logger.subscribe(['gauge:increase', 'gauge:decrease'], gauges)
    await logger.subscribe(
      ['metrics'],
      new DevConsoleWriter({ formatter: new BlockFormatter() }),
    )

    // we don't need to wait for counts to be written/updated
    await log.emit('count', { name: 'foo' })
    await log.emit('count', { name: 'bar' })
    await log.emit('count', { name: 'foo' })

    await log.emit('metrics', counts.getCount('foo'))
    await log.emit('metrics', counts.getCount('bar'))

    // we do need to wait for gauges to be written/updated for them to be accurate
    await log.publish('gauge:increase', { name: 'bar' })
    await log.publish('gauge:increase', { name: 'foo' })

    await log.publish('metrics', gauges.getGauge('foo'))
    await log.publish('metrics', gauges.getGauge('bar'))

    await log.publish('gauge:decrease', { name: 'foo' })

    await log.publish('metrics', gauges.getGauge('foo'))
    await log.publish('metrics', gauges.getGauge('bar'))
  })()
})()

// metrics: latency
;(async () => {
  const latencyWriter = () => {
    const latencies = {}

    return {
      write: async (log, meta) => {
        if (meta.event === 'latency:start') {
          latencies[meta.id] = { log, meta, start: Date.now() }
          return latencies[meta.id]
        } else if (meta.event === 'latency:end') {
          const found = latencies[log.meta.id]
          found.end = Date.now()
          console.log(`LATENCY  (duration: ${found.end - found.start})`, found.log)
          delete latencies[log.meta.id]
          return found
        }
      },
    }
  }

  // the events this instance will support
  const events = [
    'latency:start', 'latency:end',
    'trace', 'debug', 'info', 'warn', 'error', 'fatal',
  ]
  const logger = new Logger({ name: 'my-app', events })
  const { log } = logger.withSource(__filename)

  ;(async () => {
    await logger.subscribe(['latency:start', 'latency:end'], latencyWriter())
    await logger.subscribe(
      ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      new DevConsoleWriter({ formatter: new BlockFormatter() }),
    )

    await log.publish('trace', { hello: 'trace' })
    // prints: TRACE::1576081604801::/polyn-logger/test.manual.js

    // we need to wait for latency to be started for this to be accurate
    const start = await log.publish('latency:start', { hello: 'latency' })
    // does not print

    setTimeout(async () => {
      // we don't need to wait for latency end events to publish, though
      await log.emit('latency:end', start)
      // prints: LATENCY (duration: 30) { hello: 'latency' }
    }, 30)
  })()
})()
