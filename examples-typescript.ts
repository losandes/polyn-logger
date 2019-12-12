import { Logger, ILogWriter, formatters, writers } from '.';

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
const logger = new Logger({ events })
let log = logger.withSource(__filename).log

const arrayWriter = new ArrayWriter({ formatter: new StringFormatter() })
const _writers: ILogWriter[] = [
  /* 0 */ new DevConsoleWriter({ formatter: new BlockFormatter() }),
  /* 1 */ new DevConsoleWriter({ formatter: new BlockFormatter({ useColors: false }) }),
  /* 2 */ new ConsoleWriter({ formatter: new PassThroughFormatter() }),
  /* 3 */ new StdoutWriter({ formatter: new StringFormatter() }),
  /* 4 */ new StdoutWriter({ formatter: new JsonFormatter() }),
  /* 5 */ new StdoutWriter({ formatter: new BunyanFormatter(events) }),
  /* 6 */ arrayWriter,
  /* 7 */ { // custom writer
    write: async (log, meta) => {
      // format the log

      // write the log
      console.log('CUSTOM:', log, meta)
    }
  }
]

;(async () => {
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
