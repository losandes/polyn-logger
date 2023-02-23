module.exports = (test, dependencies) => {
  'use strict'

  const { LogEmitter, METRICS_CATEGORIES } = dependencies
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  return test('given @polyn/logger try-with-metrics', {
    given: () => ({ emitter: new LogEmitter() }),
    'when an action succeeds': {
      when: async ({ emitter }) => {
        const results = []
        const categories = []
        const sleepTime = 6
        const expected = {
          name: 'io',
          labels: { a: 'label' },
        }

        emitter.on('*', (meta, ...args) => {
          results.push({ meta, log: args[0] })
          categories.push(meta.category)
        })
        await emitter.tryWithMetrics(expected)(async () => {
          await sleep(sleepTime)
        })

        return { results, categories, sleepTime, expected }
      },
      'it should emit metrics events': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        const expectCount = (category, count) => {
          const len = actual.categories.filter((a) => a === category).length
          expect(len, `should emit ${count} ${category}`).to.equal(count)
        }

        expectCount(METRICS_CATEGORIES.COUNT.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.GAUGE.CATEGORY, 2)
        expectCount(METRICS_CATEGORIES.GAUGE_INCREASE.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.GAUGE_DECREASE.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.LATENCY_START.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.LATENCY_END.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.LATENCY.CATEGORY, 1)
      },
      'the logs should meet the metrics schema': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        actual.results.forEach((r) => {
          expect(r.meta.event).to.equal(actual.expected.name)
          expect(typeof r.log.id === 'string', 'id').to.equal(true)
          expect(typeof r.log.help === 'string', 'help').to.equal(true)
          expect(r.log.labels).to.deep.equal(actual.expected.labels)
        })
      },
      'it should emit latency with duration metrics': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        const found = actual.results.find((r) => r.meta.category === METRICS_CATEGORIES.LATENCY.CATEGORY)
        expect(typeof found === 'undefined', 'should emit latency category').to.equal(false)
        expect(found.log.duration.milliseconds).to.be.greaterThan(actual.sleepTime - 1) // sleep time is approximate, so subtract one in case it runs sooner than expected
      },
    },
    'when an action exceeds the timeout': {
      given: () => ({ emitter: new LogEmitter({ latencyTimeoutMs: 5 }) }),
      when: async ({ emitter }) => {
        const results = []
        const sleepTime = 10

        emitter.on('*', (meta, ...args) => {
          results.push({ meta, log: args[0] })
        })
        await emitter.tryWithMetrics({
          name: 'io',
          labels: { a: 'label' },
        })(async () => {
          await sleep(sleepTime)
        })

        return { results, sleepTime }
      },
      'it should emit a warn category': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        const found = actual.results.find((r) => r.meta.category === METRICS_CATEGORIES.WARN.CATEGORY)
        expect(typeof found === 'undefined', 'should emit warn').to.equal(false)
        expect(found.log.message).to.equal('action_timed_out')
        expect(found.log.originalLog).to.be.a('object')
      },
    },
    'when an action throws': {
      when: async ({ emitter }) => {
        const events = []
        const categories = []
        let err = null

        emitter.on('*', (meta, ...args) => {
          events.push({ meta, log: args[0] })
          categories.push(meta.category)
        })

        try {
          await emitter.tryWithMetrics({
            name: 'io',
            labels: { a: 'label' },
          })(async () => {
            throw new Error('BOOM!')
          })
        } catch (e) {
          err = e
        }

        return { events, categories, err }
      },
      'it should throw': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        expect(actual.err).to.not.equal(null)
        expect(actual.err.message).to.equal('BOOM!')
      },
      'it should emit a COUNT_ERRORS category, as well as emitting all the other metrics events, except for LATENCY': (expect) => (err, actual) => {
        expect(err).to.equal(null)
        const expectCount = (category, count) => {
          const len = actual.categories.filter((a) => a === category).length
          expect(len, `should emit ${count} ${category}`).to.equal(count)
        }

        expectCount(METRICS_CATEGORIES.COUNT_ERRORS.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.COUNT.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.GAUGE.CATEGORY, 2)
        expectCount(METRICS_CATEGORIES.GAUGE_INCREASE.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.GAUGE_DECREASE.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.LATENCY_START.CATEGORY, 1)
        expectCount(METRICS_CATEGORIES.LATENCY_END.CATEGORY, 1)

        // should not emit latency of failed actions
        expectCount(METRICS_CATEGORIES.LATENCY.CATEGORY, 0)
      },
    },
  })
}
