// Type definitions for @polyn/logger
// Project: https://github.com/losandes/polyn-logger
// Definitions by: Andy Wright <https://github.com/losandes>
// TypeScript Version: 2.1

import { ISubscriptionResult, IEventOutput } from '@polyn/async-events'

export interface ILogMeta {
  topic: string;
  id: string;
  time: number;
  event: string;
  source: string;
  hostname: string;
  pid: number;
}

export interface ILogFormatter {
  format <T> (log: any, meta: ILogMeta): Promise<T>;
}

export interface ILogWriter {
  write (log: any, meta: ILogMeta): Promise<void>;
}

export interface ILoggerOptions {
  name?: string;
  events?: string[];
  source?: string;
  hostname?: string;
  pid?: number;
}

/**
 * The main logging interface, which can be extended with specific properties
 * and functions (i.e. `log('info', { foo: 'bar' })`)
 */
export interface ILog {
  (name: string, body: any): Promise<IEventOutput>;
}

/**
 * The dynamic logging interface, which represents functions that are
 * dynamically generated at runtime (i.e. `log.info({ foo: 'bar' })`)
 */
export interface IDynamicLog {
  // The events that are present in ILoggerOptions, or the default events, if
  // those aren't set, are added to `logger.log` as functions (i.e. `log.info`)
  [event: string]: (body: any) => Promise<IEventOutput>;
}

export interface ILogger {
  name: string;
  withSource: (source: string) => ILogger;
  subscribe (events: string|string[], receiver: ILogWriter): Promise<ISubscriptionResult|ISubscriptionResult[]>;
  unsubscribe (id: string): Promise<boolean>;
  log: ILog & IDynamicLog;
}

declare class Logger implements ILogger {
  constructor (options: ILoggerOptions);
  name: string;
  withSource: (source: string) => ILogger;
  subscribe (events: string|string[], receiver: ILogWriter): Promise<ISubscriptionResult|ISubscriptionResult[]>;
  unsubscribe (id: string): Promise<boolean>;
  log: ILog & IDynamicLog;
}

export namespace formatters {
  export class BlockFormatter implements ILogFormatter {
    constructor(options?: { useColors?: boolean });
    format <T> (log: any, meta: ILogMeta): Promise<T>;
  }
  export class BunyanFormatter implements ILogFormatter {
    constructor(events: string[] | { [event: string]: number });
    format <T> (log: any, meta: ILogMeta): Promise<T>;
  }
  export class JsonFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogMeta): Promise<T>;
  }
  export class PassThroughFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogMeta): Promise<T>;
  }
  export class StringFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogMeta): Promise<T>;
  }
}

declare namespace writers {
  export class ArrayWriter implements ILogWriter {
    constructor(options: {
      formatter: ILogFormatter;
      history?: any[];
      maxSize?: number;
    });
    write (log: any, meta: ILogMeta): Promise<void>;
  }
  export class ConsoleWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogMeta): Promise<void>;
  }
  export class DevConsoleWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogMeta): Promise<void>;
  }
  export class StdoutWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogMeta): Promise<void>;
  }
}
