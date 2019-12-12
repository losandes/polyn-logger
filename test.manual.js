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
const logger = new Logger({ events })
let log = logger.withSource('@polyn/logger README').log

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
  /* 5 */ new StdoutWriter({ formatter: new BunyanFormatter(events) }),
  /* 6 */ arrayWriter,
  /* 7 */ customWriter(),
]

;(async () => {
  try {
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

    log('local', { hello: 'local' })
    log('local2', { hello: 'local2' })
    log('trace', { hello: 'trace' })
    log('trace2')
    log('debug', { hello: 'debug' })
    log('info', { hello: 'info' })
    log('warn', { hello: 'warn' })
    log('error', new Error('error!'))
    log('fatal', new Error('fatal!'))

    log = logger.withSource('changed source!').log

    log.local({ hello: 'local' })
    log.local2({ hello: 'local2' })
    log.trace({ hello: 'trace' })
    log.debug({ hello: 'debug' })
    log.info({ hello: 'info' })
    log.warn({ hello: 'warn' })
    log.error({ err: new Error('error!') })
    log.fatal({ err: new Error('fatal!') })
  } catch (e) {
    console.log('test.manual', e)
  }
})()

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

    await log('count', { name: 'foo' })
    await log('count', { name: 'bar' })
    await log('count', { name: 'foo' })

    await log('metrics', counts.getCount('foo'))
    await log('metrics', counts.getCount('bar'))

    await log('gauge:increase', { name: 'foo' })
    await log('gauge:increase', { name: 'bar' })
    await log('gauge:increase', { name: 'foo' })

    await log('metrics', gauges.getGauge('foo'))
    await log('metrics', gauges.getGauge('bar'))

    await log('gauge:decrease', { name: 'foo' })

    await log('metrics', gauges.getGauge('foo'))
    await log('metrics', gauges.getGauge('bar'))
  })()
})()

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

    log('trace', { hello: 'trace' })
    // prints: TRACE::1576081604801::/polyn-logger/test.manual.js
    const start = await log('latency:start', { hello: 'latency' })
    // does not print
    setTimeout(() => {
      log('latency:end', start)
      // prints: LATENCY (duration: 30) { hello: 'latency' }
    }, 30)
  })()
})()
