# @polyn/logger

@polyn/logger is an async, event based logger for NodeJS.

![block-formatter-dev-console-writer](screenshots/block-formatter-dev-console-writer.png)

_What does "event based" mean in the context of logging?_

In my career, most of the logging libraries that I've used either had a static set of verbosities, or were level based (10 is trace, 20 is debug, etc.). Often, they weren't extensible in the way that I needed them to be, so in order to meet product, and project needs, I've consistently done unnaturally complex things to... log information.

_So it this logger complex then?_

No. It's dead simple. It just follows a flexible event structure, instead of a fixed one. It treats disparate logging needs as a compositional problem.

For instance, we typically need to log/track many domains of information: debugging, event (info, errors), audit (PII), performance (latency), metrics (counts, and gauges), and so on. We often use a combination of technologies to deal with these domains, and it's easy for code to get overwhelmed with calls to different tracking libraries.

With @polyn/logger, all of these types of information can be written to the same logging instance, using the same patterns, and we deal with the unique aspects of each domain by subscribing to the events with purposeful log writers.

As well, code in libraries can write to this logger, and export the logger instance so code that consumes those libraries can choose whether or not to subscribe to the logs, metrics, etc.

Assuming we inject the loggers into our code (deterministic), rather than instantiating them in our code (non-deterministic), **logs become an asset that can be evaluated in our tests, and can even be used to observe code that is not exported (private)**.

_Why not use Bunyan_

Bunyan is awesome. This library is both inspired by it, and compatible with the bunyan CLI. It works very well if you need a wide variety of destination support, and need just the basic trace|debug|info|warn|error|fatal. The latter is rarely true for me anymore. If that's all you need, there is a larger community built around bunyan, and you should consider using it.

## Gettings Started

```Shell
> npm install --save @polyn/logger
```

## Creating an instance of a logger

We need to do 2 things when creating an instance of a logger: Create a log topic, and then subscribe to that topic, with a log writer.

### Creating a log topic

While it's not necessary to create a topic per domain, it's possible to do that. The examples here assume we need only one topic, and that we'll deal with differences in the domains, by subscribing to the topic with different writers.

When creating an instance of Logger, the following properties are supported:

* **name** {string?}: The name of this logger; it's topic; the name of your app, or library (default is "logger")
* **events** {string[]?}: The events this logger supports (default is: `^(trace|debug|info|warn|error|fatal)$`)
* **source** {string?}: The source of a given log (default is: 'GLOBAL'). I usually set this using `withSource(__filename)` (per file).
* **hostname** {string?}: The machine name (default is `os.hostname()` in NodeJS)
* **pid** {number?}: The process id (default is `process.pid()` in NodeJS)

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

const logger = new Logger({ name: 'my-app', events })
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
  log('trace', { hello: 'trace' })
  log('debug', { hello: 'debug' })
  log('info', { hello: 'info' })
  log('warn', { hello: 'warn' })
  log('error', { hello: 'error' })
  log('fatal', { hello: 'fatal' })

  // the events that we set on the log options are dynamically
  // added to the `log` function
  log.trace({ hello: 'trace' })
  log.debug({ hello: 'debug' })
  log.info({ hello: 'info' })
  log.warn({ hello: 'warn' })
  log.error({ hello: 'error' })
  log.fatal({ hello: 'fatal' })
})()
```

### Writing logs

As seen in "Subscribing to a log topic", we can write logs in two ways: using NodeJS' EventEmitter convention, or using the dynamically added log functions. If you are using TypeScript, the latter is probably what you want because you can write your own typings files that enforce log body for specific events. Otherwise it's developer preference.

@polyn/logger has no opinion on what a log body is. Logs can be strings, numbers, boolean, objects... whatever, as long as the writer you configure can deal with it.

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
    new DevConsoleWriter({ formatter: new BlockFormatter() })
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
```
