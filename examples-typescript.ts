import { Logger, LogEmitter, ILogWriter, formatters, writers, ILogMeta } from '.';

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

const events = ['local2', 'local', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
const arrayWriter = new ArrayWriter({ formatter: new StringFormatter() })

const customWriter = function () {
  const write = async (log: any, meta: ILogMeta) => {
    // format the log

    // write the log
    console.log('CUSTOM:', log, meta)
  }

  const listen = (meta: ILogMeta, ...args: any) => write(
    args && args.length === 1 ? args[0] : args, meta,
  )

  return { write, listen }
}

const _writers: ILogWriter[] = [
  /* 0 */ new DevConsoleWriter({ formatter: new BlockFormatter() }),
  /* 1 */ new DevConsoleWriter({ formatter: new BlockFormatter({ useColors: false }) }),
  /* 2 */ new ConsoleWriter({ formatter: new PassThroughFormatter() }),
  /* 3 */ new StdoutWriter({ formatter: new StringFormatter() }),
  /* 4 */ new StdoutWriter({ formatter: new JsonFormatter() }),
  /* 5 */ new StdoutWriter({ formatter: new BunyanFormatter(events) }),
  /* 6 */ arrayWriter,
  /* 7 */ customWriter()
]

;(async () => {
  // 0.2.2 and previous
  const logger = new Logger({ events })
  let log = logger.withSource(__filename).log

  await logger.subscribe(events, _writers[0])

  // setTimeout(() => { console.log(arrayWriter.history) }, 100)
  log('local', { hello: 'local' })
  log('local2', { hello: 'local2' })
  log('trace', { hello: 'trace' })
  log('debug', { hello: 'debug' })
  log('info', { hello: 'info' })
  log('warn', { hello: 'warn' })
  log('error', { hello: 'error' })
  log('fatal', { hello: 'fatal' })

  log = logger.withSource('changed source!').log

  log.local({ hello: 'local' })
  log.local2({ hello: 'local2' })
  log.trace({ hello: 'trace' })
  log.debug({ hello: 'debug' })
  log.info({ hello: 'info' })
  log.warn({ hello: 'warn' })
  log.error({ hello: 'error' })
  log.fatal({ hello: 'fatal' })
})()

;(() => {
  // 0.3 and after
  const logger = new LogEmitter()

  events.forEach((event: string) => {
    logger.on(event, _writers[7].listen)
  })

  logger.emit('testing_typescript', 'local', { hello: 'local' })
  logger.emit('testing_typescript', 'local2', { hello: 'local2' })
  logger.emit('testing_typescript', 'trace', { hello: 'trace' })
  logger.emit('testing_typescript', 'debug', { hello: 'debug' })
  logger.emit('testing_typescript', 'info', { hello: 'info' })
  logger.emit('testing_typescript', 'warn', { hello: 'warn' })
  logger.emit('testing_typescript', 'error', { hello: 'error' })
  logger.emit('testing_typescript', 'fatal', { hello: 'fatal' })

  const child = logger.child({ context: { child: true, foo: 'bar' } })

  child.emit('testing_typescript', 'local', { hello: 'local' })
  child.emit('testing_typescript', 'local2', { hello: 'local2' })
  child.emit('testing_typescript', 'trace', { hello: 'trace' })
  child.emit('testing_typescript', 'debug', { hello: 'debug' })
  child.emit('testing_typescript', 'info', { hello: 'info' })
  child.emit('testing_typescript', 'warn', { hello: 'warn' })
  child.emit('testing_typescript', 'error', { hello: 'error' })
  child.emit('testing_typescript', 'fatal', { hello: 'fatal' })
})()
