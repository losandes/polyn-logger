import {
  LogEmitter,
  formatters,
  writers,
} from '@polyn/logger'

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

const events = ['local2',
  'local', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']
const arrayWriter = new ArrayWriter({ formatter: new StringFormatter() })

const customWriter = function () {
  const write = async (log, meta) => {
    // format the log

    // write the log
    console.log('CUSTOM:', log, meta)
  }

  const listen = (meta, ...args) => write(
    args && args.length === 1 ? args[0] : args, meta,
  )

  return { write, listen }
}

const ciWriter = function () {
  const writer = new StdoutWriter({ formatter: new StringFormatter() })
  const write = async (log, meta) => {
    writer.write({ ...log, ...meta }, meta)
  }

  const listen = (meta, ...args) => write(
    args && args.length === 1 ? args[0] : args, meta,
  )

  return { write, listen }
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
  /* 8 */ ciWriter(),
]

;(() => {
  const logger = new LogEmitter()

  events.forEach((event) => {
    logger.on(event, _writers[8].listen)
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
