## Creating an instance of a logger

We need to do 2 things when creating an instance of a logger: Create a log topic, and then subscribe to that topic, with a log writer.

### Creating a log topic

While it's not necessary to create a topic per domain, it's possible to do that. The examples here assume we need only one topic, and that we'll deal with differences in the domains, by subscribing to the topic with different writers.

When creating an instance of Logger, the following properties are supported:

* **name** {string?}: The name of this logger; it's topic; the name of your app, or library (default is "logger")
* **events** {string[]?}: The events this logger supports (default is: `^(trace|debug|info|warn|error|fatal)$`)
* **source** {string?}: The source of a given log (default is: 'GLOBAL'). I usually set this using `logger.withSource(__filename)` (per file).
* **hostname** {string?}: The machine name (default is `os.hostname()` in NodeJS)
* **pid** {number?}: The process id (default is `process.pid()` in NodeJS)
* **defaultMode** {`/^(publish|emit)$/`}: whether the logger should "publish" (send-and-wait; default), or "emit" (send-and-move-on) to log subscribers

An instance of Logger returns the following interface:

* **name** {string}: The name of this instance
* **log** {function}: This is what you execute to emit log events - more on that later
* **withSource** {`(source: string) => Logger`}: creates a new instance of Logger using the existing configuration, except setting the source, which is emitted as part of the log metadata
* **subscribe** {`(events: string|string[], receiver: ILogWriter): Promise<ISubscriptionResult|ISubscriptionResult[]>`}: how you subscribe to log events
* **unsubscribe** {`(id: string): Promise<boolean>`}: how you unsubscribe from log events

```JavaScript
const { Logger } = require('@polyn/logger')

// the events this instance will support
const events = [
  // metrics
  // (i.e. Prometheus, Application Insights, New Relic, etc.)
  'count',
  'latency',
  'gauge',
  // audit trail
  // (i.e. events that should be auditable, such as access to, or modification of PII)
  'audit:info',
  'audit:warn',
  // only acceptable on local dev
  // (i.e. debug secrets without risking accidental logging in master)
  'local',
  // standard logging fare (events)
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal'
]

// shown with defaults:
const logger = new Logger({
  name: 'logger',
  events,
  source: 'GLOBAL',
  hostname: require('os').hostname(),
  pid: process.pid(),
  defaultMode: 'publish'
})
const { log } = logger.withSource(__filename)
```

> We are now ready to write logs... but nothing is listening for them, yet!

### Subscribing to a log topic

This library has several log writers built into it, and it's very easy to write your own, but I'll get to that later. First, lets look at an example:

```JavaScript
const { Logger, formatters, writers } = require('@polyn/logger')
const { BlockFormatter } = formatters
const { DevConsoleWriter } = writers

// the events this instance will support
const events = [
  'count', 'latency', 'gauge',                        // metrics
  'audit:info', 'audit:warn',                         // audit
  'local',                                            // local dev only!
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'  // standard events
]

const logger = new Logger({ name: 'my-app', events })
const { log } = logger.withSource(__filename)

;(async () => {
  // subscriptions should be awaited (or promised) before we emit logs
  await logger.subscribe(
    ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    new DevConsoleWriter({ formatter: new BlockFormatter() })
  )

  // nothing is listening for 'count', 'latency', 'gauge', 'audit:info',
  // 'audit:warn', or 'local' yet

  // we can emit logs using NodeJS' EventEmitter convention
  await log('trace', { hello: 'trace' })
  await log('debug', { hello: 'debug' })
  await log('info', { hello: 'info' })
  await log('warn', { hello: 'warn' })
  await log('error', { hello: 'error' })
  await log('fatal', { hello: 'fatal' })

  // the events that we set on the log options are dynamically
  // added to the `log` function
  await log.trace({ hello: 'trace' })
  await log.debug({ hello: 'debug' })
  await log.info({ hello: 'info' })
  await log.warn({ hello: 'warn' })
  await log.error({ hello: 'error' })
  await log.fatal({ hello: 'fatal' })
})()
```

### Writing logs

As seen in "Subscribing to a log topic", we can write logs in two ways: using NodeJS' EventEmitter convention, or using the dynamically added log functions. If you are using TypeScript, the latter might be useful because you can write your own typings files that enforce log body types for specific events. Otherwise it's developer preference.

@polyn/logger has no opinion on what a log body is. Logs can be strings, numbers, boolean, objects... whatever, as long as the configured writer can deal with it.

```JavaScript
const { Logger, formatters, writers } = require('@polyn/logger')

// the events this instance will support
const events = ['foo', 'bar', 'str', 'more']

const logger = new Logger({ name: 'my-app', events })
const { log } = logger.withSource(__filename)

// await <subscribe to the logs with a writer>

// we can emit logs using NodeJS' EventEmitter convention
log('foo', { hello: 'foo' })
log('bar', { hello: 'bar' })
log('str', 'message here')
log('more', 'message', 9, true, { details: 42 }) // multiple args are emitted as an array

// the events that we set on the log options are dynamically
// added to the `log` function
log.foo({ hello: 'foo' })
log.bar({ hello: 'bar' })
log.str('message here')
log.more('message', 2, false, { details: 42 }) // multiple args are emitted as an array
```

#### Publishing vs. Emitting

See the [@polyn/async-events](https://github.com/losandes/polyn-async-events#polynasync-events) documentation for [Publishing a topic](https://github.com/losandes/polyn-async-events#publishing-to-a-topic), and [Emitting a topic](https://github.com/losandes/polyn-async-events#emitting-to-a-topic) for more detailed information.

**tl;dr**: By default, this logger "publishes" the logs (send-and-wait), which means that it waits for subscribers to finish their work before moving on. This is optimized for logging to the console. If you are writing to streams, or other systems, you might prefer to emit the logs instead (send-and-move-on). You can set the default behavior to `defaultMode: 'emit'` when creating an instance of `Logger`. Regardless of the mode, you can always control the behavior using the `log.publish`, and `log.emit` functions.

See [Cookbook: Measuring counts, or gauges with logs](#cookbook-measuring-counts-or-gauges-with-logs), or [Cookbook: Measuring duration / latency with logs](#cookbook-measuring-duration--latency-with-logs) for an examples that use both `emit`, and `publish`.

### Available writers, and formatters

This library exports both formatters, and writers, which can be used interchangeably, or as part of your own custom writers, or formatters. That being said, each formatter this library exports is optimized for a specific writer. The examples here illustrate that coupling.

The ArrayWriter is great for testing, and log evaluation. Which formatter you use for that really depends on how you're evaluating your logs.

Formatters:

* **BlockFormatter**
* **BunyanFormatter**
* **JsonFormatter**
* **PassThroughFormatter**
* **StringFormatter**

Writers:

* **ArrayWriter**
* **ConsoleWriter**
* **DevConsoleWriter**
* **StdoutWriter**

```JavaScript
new DevConsoleWriter({ formatter: new BlockFormatter() })
```

![block-formatter-dev-console-writer](screenshots/block-formatter-dev-console-writer.png)

```JavaScript
new DevConsoleWriter({
  formatter: new BlockFormatter({
    useColors: false
  })
})
```

![block-formatter-dev-console-writer-no-colors](screenshots/block-formatter-dev-console-writer-no-colors.png)

```JavaScript
new ConsoleWriter({ formatter: new PassThroughFormatter() })
```

![passthrough-formatter-console-writer](screenshots/passthrough-formatter-console-writer.png)

```JavaScript
new StdoutWriter({ formatter: new StringFormatter() })
```

![string-formatter-stdout-writer](screenshots/string-formatter-stdout-writer.png)

```JavaScript
new StdoutWriter({ formatter: new JsonFormatter() })
```

![json-formatter-stdout-writer](screenshots/json-formatter-stdout-writer.png)

#### The bunyan formatter

The bunyan formatter accepts an `events` argument which you can use to map the events you are logging to bunyan's level system.

```JavaScript
// given these events
const events = ['local', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']

// configure the bunyan levels that should be associated with them
new StdoutWriter({
  formatter: new BunyanFormatter({
    local: 10
    trace: 10
    debug: 20
    info: 30
    warn: 40
    error: 50
    fatal: 60
  })
})
```

The bunyan formatter is expected to be used with bunyan CLI: `node test | npx bunyan`.

![bunyan-formatter-stdout-writer](screenshots/bunyan-formatter-stdout-writer.png)

### Cookbook: Roll your own log writer

To subscribe to an instance of Logger, you need to present it with an object that has an asynchronous `write` function, or promise. Once subscribed, the write function will receive log bodies as the first argument, and log metadata as the second argument. Log bodies can be anything. Log metadata has the following properties:

* **topic** {string}: The name of the logger
* **id** {string}: A random identifier for this log, which can be used when measuring duration, latency, etc.
* **time** {number}: Milliseconds since epoch that this log was written
* **event** {string}: The event that was emitted
* **source** {string}: The source (i.e. `withSource(__filename)`) of the event
* **hostname** {string}: The machine name
* **pid** {number}: The process id

```JavaScript
const { Logger } = require('@polyn/logger')

// the events this instance will support
const events = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
const logger = new Logger({ name: 'my-app', events })
const { log } = logger.withSource(__filename)

;(async () => {
  await logger.subscribe(events, {
    write: async (log, meta) => {
      console.log('CUSTOM:', log, meta)
    }
  })

  log('trace', { hello: 'trace' })
  log.trace({ hello: 'trace' })
})()
```

### Cookbook: Measuring counts, or gauges with logs

```JavaScript
const { Logger, formatters, writers } = require('@polyn/logger')
const { BlockFormatter } = formatters
const { DevConsoleWriter } = writers

const countWriter = () => {
  const counts = {}

  return {
    getCount: (name) => counts[name],
    write: async (log, meta) => {
      counts[log.name] = counts[log.name] || { name: log.name, count: 0 }
      counts[log.name].count += 1
    }
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

    }
  }
}

// the events this instance will support
const events = [
  'count',
  'gauge:increase', 'gauge:decrease',
  'metrics'
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
    new DevConsoleWriter({ formatter: new BlockFormatter() })
  )

  // we don't need to wait for counts to be written/updated
  await log.emit('count', { name: 'foo' })
  await log.emit('count', { name: 'bar' })
  await log.emit('count', { name: 'foo' })

  await log.emit('metrics', counts.getCount('foo'))
  await log.emit('metrics', counts.getCount('bar'))

  // we do need to wait for gauges to be written/updated for them to be accurate
  await log.publish('gauge:increase', { name: 'foo' })
  await log.publish('gauge:increase', { name: 'bar' })
  await log.publish('gauge:increase', { name: 'foo' })

  await log.publish('metrics', gauges.getGauge('foo'))
  await log.publish('metrics', gauges.getGauge('bar'))

  await log.publish('gauge:decrease', { name: 'foo' })

  await log.publish('metrics', gauges.getGauge('foo'))
  await log.publish('metrics', gauges.getGauge('bar'))
})()
```


### Cookbook: Measuring duration / latency with logs

Let's start with an example writer:

```JavaScript
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
    }
  }
}
```

This writer expects two events to be emitted: one to start the timer, and another to end it. Alternatively, the log body could be used to indicate start and end with a single event name. Below is an example that shows how to use such a timer:

```JavaScript
const { Logger, formatters, writers } = require('@polyn/logger')
const { BlockFormatter } = formatters
const { DevConsoleWriter } = writers

// const latencyWriter = <latencyTimer here> (example above)

// the events this instance will support
const events = [
  'latency:start', 'latency:end',
  'trace', 'debug', 'info', 'warn', 'error', 'fatal'
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
```
