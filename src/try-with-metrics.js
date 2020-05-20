/**
 * @param {@polyn/blueprint} blueprint
 * @param {@polyn/immutable} immutable
 * @param {Function} makeId
 * @param {Function} clock
 * @param {Function} duration
 */
function TryWithMetricsFactory (deps) {
  'use strict'

  const { optional } = deps.blueprint
  const { immutable } = deps.immutable
  const { makeId, time } = deps

  const _METRICS_CATEGORIES = {
    WARN: {
      CATEGORY: 'warn',
      HELP: 'for events where this module encounters unexpected behavior',
    },
    COUNT: {
      CATEGORY: 'count',
      HELP: 'counts the number of occurences of a given action',
    },
    COUNT_ERRORS: {
      CATEGORY: 'count_errors',
      HELP: 'counts the number of errors that occur when executing a given action',
    },
    GAUGE: {
      CATEGORY: 'gauge',
      HELP: 'tracks the number of a given action currently being executed',
    },
    GAUGE_INCREASE: {
      CATEGORY: 'gauge_increase',
      HELP: 'tracks an increase in the number of a given action currently beint executed',
    },
    GAUGE_DECREASE: {
      CATEGORY: 'gauge_decrease',
      HELP: 'tracks an decrease in the number of a given action currently beint executed',
    },
    LATENCY_START: {
      CATEGORY: 'latency_start',
      HELP: 'tracks the beginning time of a given action',
    },
    LATENCY_END: {
      CATEGORY: 'latency_end',
      HELP: 'tracks the end time of a given action, and emits the latency event',
    },
    LATENCY: {
      CATEGORY: 'latency',
      HELP: 'measures the length of time it takes to complete a given action',
    },
  }

  const _CATEGORY_SCHEMA = {
    CATEGORY: 'string',
    HELP: 'string',
  }

  const TryWithMetricsOptions = immutable('TryWithMetricsOptions', {
    emitter: { on: 'function', emit: 'function' },
    timeUnits: optional(/^(s|ms|us|ns)$/).withDefault('us'),
    latencyTimeoutMs: optional('number').withDefault(30000),
    METRICS_CATEGORIES: {
      WARN: _CATEGORY_SCHEMA,
      COUNT: _CATEGORY_SCHEMA,
      COUNT_ERRORS: _CATEGORY_SCHEMA,
      GAUGE: _CATEGORY_SCHEMA,
      GAUGE_INCREASE: _CATEGORY_SCHEMA,
      GAUGE_DECREASE: _CATEGORY_SCHEMA,
      LATENCY_START: _CATEGORY_SCHEMA,
      LATENCY_END: _CATEGORY_SCHEMA,
      LATENCY: _CATEGORY_SCHEMA,
    },
  })

  const TryWithMetricsActionOptions = immutable('TryWithMetricsActionOptions', {
    name: 'string',
    labels: 'object?',
    shouldCountError: optional('function').withDefault(() => () => true),
  })

  const measureLatency = (input) => {
    const { emitter, METRICS_CATEGORIES, timeUnits, latencyTimeoutMs } = input
    const latencies = {}
    const timers = {}

    const addTimeout = (meta, log) => {
      timers[log.id] = {
        timeout: setTimeout(() => {
          emitter.emit(meta.event, METRICS_CATEGORIES.WARN.CATEGORY, {
            message: 'action_timed_out',
            originalLog: { log, meta }
          })
          removeTimeout(meta, log)
        }, latencyTimeoutMs)
      }
    }

    const removeTimeout = (meta, log) => {
      const timer = timers[log.id]

      if (timer) {
        clearTimeout(timer.timeout)
        delete timers[log.id]
      }
    }

    emitter.on(METRICS_CATEGORIES.LATENCY_START.CATEGORY, (meta, ...args) => {
      const log = args[0]
      latencies[log.id] = { log, meta, startTime: time.clock(timeUnits) }
      addTimeout(meta, log)
    })

    emitter.on(METRICS_CATEGORIES.LATENCY_END.CATEGORY, (meta, ...args) => {
      const log = args[0]
      removeTimeout(meta, log)
      const found = latencies[log.id]
      const duration = time.duration(found.startTime, time.clock(timeUnits), timeUnits)

      if (!log.err) {
        // don't measure the duration of failed actions
        emitter.emit(meta.event, METRICS_CATEGORIES.LATENCY.CATEGORY, {
          ...log,
          ...{
            duration,
            help: METRICS_CATEGORIES.LATENCY.HELP,
          }
        })
      }
    })
  }

  const makeTryWithMetrics = (options) => {
    const { timeUnits, latencyTimeoutMs, METRICS_CATEGORIES } = new TryWithMetricsOptions({
      ...{ METRICS_CATEGORIES: _METRICS_CATEGORIES },
      ...options
    })
    const emitter = options.emitter // use the original emitter, not the immutable'd one
    measureLatency({ emitter, METRICS_CATEGORIES, timeUnits, latencyTimeoutMs })

    return (input) => async (action) => {
      const {
        name, labels, shouldCountError,
      } = new TryWithMetricsActionOptions(input)
      const id = makeId()
      let result
      let err

      try {
        emitter.emit(name, METRICS_CATEGORIES.COUNT.CATEGORY, { id, labels, help: METRICS_CATEGORIES.COUNT.HELP })
        emitter.emit(name, METRICS_CATEGORIES.GAUGE.CATEGORY, { id, labels, help: METRICS_CATEGORIES.GAUGE.HELP, direction: 'increase' })
        emitter.emit(name, METRICS_CATEGORIES.GAUGE_INCREASE.CATEGORY, { id, labels, help: METRICS_CATEGORIES.GAUGE_INCREASE.HELP })
        emitter.emit(name, METRICS_CATEGORIES.LATENCY_START.CATEGORY, { id, labels, help: METRICS_CATEGORIES.LATENCY_START.HELP })

        result = await action()
      } catch (error) {
        err = error
        if (shouldCountError(error, input)) {
          emitter.emit(name, METRICS_CATEGORIES.COUNT_ERRORS.CATEGORY, { id, labels, help: METRICS_CATEGORIES.COUNT_ERRORS.HELP })
        }

        throw error
      } finally {
        emitter.emit(name, METRICS_CATEGORIES.LATENCY_END.CATEGORY, { id, labels, help: METRICS_CATEGORIES.LATENCY_END.HELP, err })
        emitter.emit(name, METRICS_CATEGORIES.GAUGE.CATEGORY, { id, labels, help: METRICS_CATEGORIES.GAUGE.HELP, direction: 'decrease' })
        emitter.emit(name, METRICS_CATEGORIES.GAUGE_DECREASE.CATEGORY, { id, labels, help: METRICS_CATEGORIES.GAUGE_DECREASE.HELP })
      }

      return result
    }
  }

  return { makeTryWithMetrics, METRICS_CATEGORIES: _METRICS_CATEGORIES }
}

module.exports = TryWithMetricsFactory
