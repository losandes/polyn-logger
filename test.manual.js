const { Logger, LogEmitter, formatters, writers } = require('@polyn/logger')
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
const standardFare = async () => {
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

    await writeLogs(logger)
    await writeLogs(logger.withSource('@polyn/logger README 1'))
    await writeLogs(logger.withSource('@polyn/logger README 2'))
  } catch (e) {
    console.log('test.manual', e)
  }
}

// multiple parameters, and parameter types
const multipleParams = async () => {
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
}

// publish / emit
const publishAndEmit = async () => {
  try {
    const logger = new Logger({ name: 'publish/emit', events: ['info'] })
    await logger.subscribe(['info'], _writers[0])
    const { log } = logger.withSource('publish/emit')

    log.publish('info', { hello: 'publish:info' })
    log.emit('info', { hello: 'emit:info' })
  } catch (e) {
    console.log('test.manual/publish-emit', e)
  }
}

// Logger metrics: counts & gauges
const countsAndGaugesLogger = async () => {
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
}

// LogEmitter metrics: counts & gauges
const countsAndGaugesLogEmitter = async () => {
  const log = new LogEmitter()

  function CountWriter () {
    const counts = {}

    return {
      getCount: (name) => counts[name],
      write: async (meta, ...args) => {
        const log = args[0]
        counts[meta.event] = counts[meta.event] || { name: meta.event, count: 0 }
        counts[meta.event].count += 1
      },
    }
  }

  function GaugeWriter () {
    const gauges = {}

    return {
      getGauge: (name) => { return gauges[name] },
      write: async (meta, ...args) => {
        const log = args[0]
        if (meta.category === 'gauge:increase') {
          gauges[meta.event] = gauges[meta.event] || { name: meta.event, gauge: 0 }
          gauges[meta.event].gauge += 1
        } else if (meta.category === 'gauge:decrease') {
          gauges[meta.event] = gauges[meta.event] || { name: meta.event, gauge: 1 }
          gauges[meta.event].gauge -= 1
        }
      },
    }
  }

  const counts = new CountWriter()
  const gauges = new GaugeWriter()

  log.on('count', counts.write)
  log.on('gauge:increase', gauges.write)
  log.on('gauge:decrease', gauges.write)
  log.on('metrics', (meta, ...args) =>
    console.log(meta.event, args[0])
  )

  const testCountMetrics = (name, expected) => {
    const actual = counts.getCount(name)
    return {
      success: expected === actual.count,
      expected: expected,
      actual,
    }
  }

  const testGaugeMetrics = (name, expected) => {
    const actual = gauges.getGauge(name)
    return {
      success: expected === actual.gauge,
      expected: expected,
      actual,
    }
  }

  log.emit('foo', 'count', { labels: { a: 'label' } })
  log.emit('bar', 'count', { labels: { a: 'label' } })
  log.emit('foo', 'count', { labels: { a: 'label' } })

  log.emit('foo', 'metrics', testCountMetrics('foo', 2))
  log.emit('bar', 'metrics', testCountMetrics('bar', 1))

  log.emit('bar', 'gauge:increase', { labels: { a: 'label' } })
  log.emit('foo', 'gauge:increase', { labels: { a: 'label' } })

  log.emit('foo', 'metrics', testGaugeMetrics('foo', 1))
  log.emit('bar', 'metrics', testGaugeMetrics('bar', 1))

  log.emit('foo', 'gauge:decrease', { labels: { a: 'label' } })

  log.emit('foo', 'metrics', testGaugeMetrics('foo', 0))
  log.emit('bar', 'metrics', testGaugeMetrics('bar', 1))
}

// Logger metrics: latency
const latencyLogger = async () => {
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
}

// LogEmitter metrics: latency
const latencyLogEmitter = async () => {
  const log = new LogEmitter()
  const { randomBytes } = require('crypto')

  function LatencyWriter () {
    const latencies = {}

    return {
      write: async (meta, ...args) => {
        const log = args[0]
        if (meta.category === 'latency:start') {
          latencies[meta.event] = {
            log,
            meta,
            start: Date.now()
          }
        } else if (meta.category === 'latency:end') {
          const end = Date.now()
          const found = latencies[meta.event]
          console.log(`LATENCY  (duration: ${end - found.start})`, found.log)
          delete latencies[meta.event]
        }
      },
    }
  }

  const latencyWriter = new LatencyWriter()

  log.on('latency:start', latencyWriter.write)
  log.on('latency:end', latencyWriter.write)

  const id = randomBytes(4).toString('hex')
  log.emit(id, 'latency:start', { labels: { a: 'property' } })
  // does not print

  setTimeout(() => {
    log.emit(id, 'latency:end')
    // prints: LATENCY (duration: 30) { hello: 'latency' }
  }, 30)
}

// log emitter
const logEmitter = async () => {
  const emitter = new LogEmitter()
  const writer = _writers[0]
  const writeLog = async (meta, ...args) =>
    writer.write(args && args.length === 1 ? args[0] : args, meta)
  const writeLogIf = (matcher) => async (meta, ...args) => {
    if (matcher(meta, ...args)) {
      return writeLog(meta, meta, ...args)
    }
  }
  const cleanseAndWrite = async (meta, ...args) => {
    const body = { ...args[0] }
    delete body.secret
    return writeLog(meta, body)
  }

  ;['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'special']
    .forEach((level) => emitter.on(level, writeLog))
  emitter.on('*', writeLogIf((meta) => /^regex_/.test(meta.event)))
  emitter.on('has_secret', cleanseAndWrite)

  emitter.emit('hello_world', 'debug', { hello: 'emitter.emit("hello_world", "debug")' })
  emitter.emit('multi-arg', 'debug',
    { hello: 'emitter.emit("multi-arg", "debug")' },
    { something: 'else' }
  )
  emitter.emit('special', 'local', { hello: 'emitter.emit("special", "local")' })
  emitter.emit('regex_test', 'local', { hello: 'emitter.emit("regex_test", "local")' })
  emitter.emit('has_secret', 'local', {
    hello: 'emitter.emit("has_secret", "local")',
    secret: 'shhhhh',
  })
}

// README - getting started
const gettingStarted = async () => {
  const log = new LogEmitter()
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter()
  })
  const writeLog = async (meta, ...args) =>
    logWriter.write(args && args.length === 1 ? args[0] : args, meta)

  // subscribe to a category
  log.on('info', writeLog)

  // subscribe to multiple categories
  ;['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(
    (category) => log.on(category, writeLog)
  )

  // subscribe to an event
  log.on('app_startup', writeLog)

  // subscribe to all events
  log.on('*', writeLog)

  // subscribe to events that have no subscriptions
  log.on('no_listeners', writeLog)

  log.emit('app_startup', 'info', { hello: 'world' })
}

// README - piping emitters
const emitterPiping = async () => {
  const log1 = new LogEmitter()
  const log2 = new LogEmitter()
  const log3 = new LogEmitter()
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter()
  })
  const writeLog = async (meta, ...args) =>
    logWriter.write(args && args.length === 1 ? args[0] : args, meta)

  log2.on('*', log1.pipe())
  log3.on('*', log1.pipe())
  log1.on('info', writeLog)

  log2.emit('log2', 'info', { hello: 'world' })
  log3.emit('log3', 'info', { hello: 'world' })
}

// README - child emitters
const emitterChildren = async () => {
  const log1 = new LogEmitter()
  const log2 = log1.child()
  const log3 = log1.child()
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter()
  })
  const writeLog = async (meta, ...args) =>
    logWriter.write(args && args.length === 1 ? args[0] : args, meta)

  log1.on('info', writeLog)

  log2.emit('log2', 'info', { hello: 'world' })
  log3.emit('log3', 'info', { hello: 'world' })
}

// README - adding context to emitters
const emitterContext = async () => {
  const Koa = require('koa')
  const Router = require('koa-router')

  const appLogger = new LogEmitter()
  appLogger.on('*', console.log)

  const app = new Koa()
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.state.log.emit('http_get', 'info', { hello: 'world' })
    ctx.status = 200
    ctx.body = { hello: 'world' }
  })

  app.use(async (ctx, next) => {
    ctx.state = ctx.state || {}
    ctx.state.log = appLogger.child({
      context: {
        method: ctx.request.method,
        href: ctx.request.href,
      },
    })

    await next()
  })

  app.use(router.routes())
  app.listen(3000)
  appLogger.emit('startup', 'info', 'listening on port 3000')
}

// README - roll your own log writer
const rollYourLogWriter = async () => {
  const log = new LogEmitter({
    context: {
      a: 'property'
    }
  })

  log.on('*', async (meta, ...args) => {
    const parts = [
      `[${new Date(meta.time).toISOString()}]`,
      `${meta.category.toUpperCase().padStart(6)}`,
      `(${meta.event.toUpperCase()})`.padStart(12) + ':',
      `${meta.pid} on ${meta.hostname}`,
      `(${meta.source}):`,
    ]
    const body = typeof args[0] === 'string'
      ? { ...meta.context, ...{ msg: args[0] } }
      : { ...meta.context, ...args[0] }

    delete body.secret
    console.log(parts.join(' ') + JSON.stringify(body))
  })

  log.emit('startup', 'info', 'listening on port 3000')
  log.emit('has_secret', 'debug', { hello: 'world', secret: 'shhhhh' })
}

;(async () => {
  await standardFare()
  await multipleParams()
  await publishAndEmit()
  await countsAndGaugesLogger()
  await countsAndGaugesLogEmitter()
  await latencyLogger()
  await latencyLogEmitter()
  await logEmitter()
  await gettingStarted()
  await emitterPiping()
  await emitterChildren()
  // await emitterContext()
  await rollYourLogWriter()
})()