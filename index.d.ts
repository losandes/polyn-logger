// Type definitions for @polyn/logger
// Project: https://github.com/losandes/polyn-logger
// Definitions by: Andy Wright <https://github.com/losandes>
// TypeScript Version: 2.1

import * as EventEmitter from 'events'

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

export interface ILogFormatter {
  format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
}

export namespace formatters {
  export class BlockFormatter implements ILogFormatter {
    constructor(options?: { useColors?: boolean });
    format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
  }
  export class BunyanFormatter implements ILogFormatter {
    constructor(events: string[] | { [event: string]: number });
    format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
  }
  export class JsonFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
  }
  export class PassThroughFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
  }
  export class StringFormatter implements ILogFormatter {
    format <T> (log: any, meta: ILogEmitterMeta): Promise<T>;
  }
}

export interface ILogWriter {
  write (log: any, meta: ILogEmitterMeta): Promise<void>;
  listen (meta: ILogEmitterMeta, ...args: any): Promise<void>;
}

declare namespace writers {
  export class ArrayWriter implements ILogWriter {
    history: any[];
    maxSize: number;

    constructor(options: {
      formatter: ILogFormatter;
      history?: any[];
      maxSize?: number;
    });
    write (log: any, meta: ILogEmitterMeta): Promise<void>;
    listen (meta: ILogEmitterMeta, ...args: any): Promise<void>;
  }
  export class ConsoleWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogEmitterMeta): Promise<void>;
    listen (meta: ILogEmitterMeta, ...args: any): Promise<void>;
  }
  export class DevConsoleWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogEmitterMeta): Promise<void>;
    listen (meta: ILogEmitterMeta, ...args: any): Promise<void>;
  }
  export class StdoutWriter implements ILogWriter {
    constructor(options: { formatter: ILogFormatter });
    write (log: any, meta: ILogEmitterMeta): Promise<void>;
    listen (meta: ILogEmitterMeta, ...args: any): Promise<void>;
  }
}

export interface ILogEmitter extends EventEmitter {
  emit(event: string | symbol, level: string, ...args: any[]): boolean;
  pipe(meta: ILogEmitterMeta, ...args: any[]): boolean;
  child(options: ILogEmitterOptions): LogEmitter;
  tryWithMetrics(options: ITryWithMetricsOptions): (action: Promise<any>) => Promise<any>;
}

/**
 * This is a copy of NodeJS' interface which they didn't export
 * for some reason. Using a copy risks falling out of sync with NodeJS
 * so the constructor for LogEmitter accepts `options?: ILogEmitterOptions | any | undefined`
 * instead of `options?: ILogEmitterOptions | EventEmitterOptions | undefined`.
 *
 * This copy is here for posterity... so you can see an example of the
 * base class options that you could pass through with your options
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/events.d.ts
 */
interface EventEmitterOptions {
  /**
   * Enables automatic capturing of promise rejection.
   */
  captureRejections?: boolean | undefined;
}

declare class LogEmitter extends EventEmitter implements ILogEmitter {
  constructor(options?: ILogEmitterOptions | any | undefined);
  emit(event: string | symbol, level: string, ...args: any[]): boolean;
  pipe(meta: ILogEmitterMeta, ...args: any[]): boolean;
  child(options: ILogEmitterOptions): LogEmitter;
  tryWithMetrics(options: ITryWithMetricsOptions): (action: Promise<any>) => Promise<any>;
}
