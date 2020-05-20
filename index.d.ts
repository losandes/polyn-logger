// Type definitions for @polyn/logger
// Project: https://github.com/losandes/polyn-logger
// Definitions by: Andy Wright <https://github.com/losandes>
// TypeScript Version: 2.1

import * as EventEmitter from 'events'
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

export interface ILogEmitterMeta {
  event: string;
  category: string;
  level: number;
  source: string;
  time: number;
  hostname: string;
  pid: number;
  context?: any;
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

interface CATEGORY_SCHEMA {
  CATEGORY: string;
  HELP: string;
}

export interface ILogEmitterOptions {
  source?: string;
  hostname?: string;
  pid?: number;
  wildcardEvent?: string;
  noListenersEvent?: string;
  context?: any;
  // for try with metrics:
  latencyTimeoutMs?: number;
  METRICS_CATEGORIES?: {
    WARN?: CATEGORY_SCHEMA,
    COUNT?: CATEGORY_SCHEMA,
    COUNT_ERRORS?: CATEGORY_SCHEMA,
    GAUGE?: CATEGORY_SCHEMA,
    GAUGE_INCREASE?: CATEGORY_SCHEMA,
    GAUGE_DECREASE?: CATEGORY_SCHEMA,
    LATENCY_START?: CATEGORY_SCHEMA,
    LATENCY_END?: CATEGORY_SCHEMA,
    LATENCY?: CATEGORY_SCHEMA,
  },
}

export interface ITryWithMetricsOptions {
  name: string;
  labels?: any; // i.e. { method: ctx.request.method, href: ctx.request.href }
  shouldCountError? (err: Error, input: ITryWithMetricsOptions): boolean;
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

declare class LogEmitter extends EventEmitter {
  constructor(options: ILogEmitterOptions | any);
  emit(event: string | symbol, level: string, ...args: any[]): boolean;
  pipe(meta: ILogEmitterMeta, ...args: any[]): boolean;
  child(options: ILogEmitterOptions): LogEmitter;
  tryWithMetrics(options: ITryWithMetricsOptions): (action: Promise<any>) => Promise<any>;
}
