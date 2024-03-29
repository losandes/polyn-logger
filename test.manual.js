const { LogEmitter, formatters, writers } = require('@polyn/logger')
const {
  BlockFormatter,
  BunyanFormatter,
  JsonFormatter,
  PassThroughFormatter,
  StringFormatter,
  SquashFormatter,
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
  /* 8 */ new StdoutWriter({ formatter: new SquashFormatter() }),
]

// LogEmitter metrics: counts & gauges
const countsAndGaugesLogEmitter = async () => {
  const log = new LogEmitter()

  function CountWriter () {
    const counts = {}

    return {
      getCount: (name) => counts[name],
      write: async (meta, ...args) => {
        // const log = args[0]
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
        // const log = args[0]
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
    console.log(meta.event, args[0]),
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
            start: Date.now(),
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
    { something: 'else' },
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
    formatter: new formatters.BlockFormatter(),
  })

  // subscribe to a category
  log.on('info', logWriter.listen)

  // subscribe to multiple categories
  ;['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(
    (category) => log.on(category, logWriter.listen),
  )

  // subscribe to an event
  log.on('app_startup', logWriter.listen)

  // subscribe to all events
  log.on('*', logWriter.listen)

  // subscribe to events that have no subscriptions
  log.on('no_listeners', logWriter.listen)

  log.emit('app_startup', 'info', { hello: 'world' })
}

// README - child emitters
const emitterChildren = async () => {
  const log1 = new LogEmitter()
  const log2 = log1.child()
  const log3 = log2.child()
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter(),
  })

  log1.on('info', logWriter.listen)
  log2.emit('log2', 'info', { hello: 'world' })
  log3.emit('log3', 'info', { hello: 'world' })
}

// README - piping emitters
const emitterPiping = async () => {
  const log1 = new LogEmitter()
  const log2 = new LogEmitter()
  const log3 = new LogEmitter()
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter(),
  })

  log2.on('*', log1.pipe())
  log3.on('*', log1.pipe())
  log1.on('info', logWriter.listen)

  log2.emit('log2', 'info', { hello: 'world' })
  log3.emit('log3', 'info', { hello: 'world' })
}

// README - adding context to emitters
const emitterContext = async () => { // eslint-disable-line no-unused-vars
  const Koa = require('koa')
  const Router = require('koa-router')

  const appLogger = new LogEmitter()
  const logWriter = new writers.StdoutWriter({
    formatter: new formatters.SquashFormatter(),
  })
  appLogger.on('*', logWriter.listen)

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
      a: 'property',
    },
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

const tryWithMetrics = async () => {
  const log = new LogEmitter({
    // default timeout for latency measurement is 30 seconds
    latencyTimeoutMs: 30000,
    METRICS_CATEGORIES: {
      WARN: {
        CATEGORY: 'metrics_warn', // default is 'warn'
        HELP: 'my override',
      },
      // COUNT: // same schema as WARN example
      // COUNT_ERRORS: // same schema as WARN example
      // GAUGE: // same schema as WARN example
      // GAUGE_INCREASE: // same schema as WARN example
      // GAUGE_DECREASE: // same schema as WARN example
      // LATENCY_START: // same schema as WARN example
      // LATENCY_END: // same schema as WARN example
      // LATENCY: // same schema as WARN example
    },
  })
  const logWriter = new writers.DevConsoleWriter({
    formatter: new formatters.BlockFormatter(),
  })
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  // counts the number of occurences of a given action
  log.on('count', logWriter.listen)

  // counts the number of errors that occur when executing a given action
  log.on('count_errors', logWriter.listen)

  // tracks the number of a given action currently being executed
  log.on('gauge', logWriter.listen)

  // OR you can subscribe to gauge increase, and decrease separately
  // tracks an increase in the number of a given action currently beint executed
  log.on('gauge_increase', logWriter.listen)

  // tracks an decrease in the number of a given action currently beint executed
  log.on('gauge_decrease', logWriter.listen)

  // tracks the beginning time of a given action
  log.on('latency_start', logWriter.listen)

  // tracks the end time of a given action, and emits the latency event
  log.on('latency_end', logWriter.listen)

  // measures the length of time it takes to complete a given action
  // you can just subscribe to this, if you want the duration, and
  // don't need to set a timer yourself
  log.on('latency', logWriter.listen)

  // for events where this module encounters unexpected behavior
  // i.e. latency timeouts
  log.on('metrics_warn' /* 'warn' if you didn't override this */, logWriter.listen)

  await log.tryWithMetrics({
    name: 'http_request',
    labels: {
      method: 'GET',
      href: 'https://localhost:3000',
    },
  })(async () => {
    // http request here
    await sleep(5)
  })

  // NOTE that tryWithMetrics returns curried functions so you can:
  const tryHttpRequest = log.tryWithMetrics({
    name: 'http_request',
    labels: {
      method: 'GET',
      href: 'https://localhost:3000',
    },
  })
  await tryHttpRequest(async () => {
    // http request here
    await sleep(5)
  })
}

;(async () => {
  await countsAndGaugesLogEmitter()
  await latencyLogEmitter()
  await logEmitter()
  await gettingStarted()
  await emitterChildren()
  await emitterPiping()
  await rollYourLogWriter()
  await tryWithMetrics()
  // await emitterContext()
})()
