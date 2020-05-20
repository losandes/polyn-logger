module.exports = (test, dependencies) => {
  'use strict'

  const { LogEmitter, METRICS_CATEGORIES } = dependencies
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  return test('given @polyn/logger', {
    'given LogEmitter': {
      given: () => new LogEmitter(),
      'when I emit an event that has a 1:1 subscription': {
        when: (emitter) => {
          const eventResults = []
          const levelResults = []
          const wildcardResults = []
          const noSubscriberResults = []
          emitter.on('foo_bar', (...args) => eventResults.push(args))
          emitter.on('debug', (...args) => levelResults.push(args))
          emitter.on('info', (...args) => levelResults.push(args))
          emitter.on('*', (...args) => wildcardResults.push(args))
          emitter.emit('foo_bar', 'debug', { two: 'two' })
          emitter.emit('foo_bar', 'info', { two: 'two' })
          emitter.on('', (...args) => noSubscriberResults.push(args))

          return { eventResults, levelResults, wildcardResults, noSubscriberResults }
        },
        'I should be able to subscribe to the events': (expect) => (err, actual) => {
          expect(err).to.equal(null)
          expect(actual.noSubscriberResults.length).to.equal(0)
          expect(actual.eventResults.length).to.equal(2)

          expect(actual.eventResults[0][1]).to.deep.equal({ two: 'two' })
          expect(actual.eventResults[0][0].event).to.equal('foo_bar')
          expect(actual.eventResults[0][0].category).to.equal('debug')
          expect(actual.eventResults[0][0].level).to.equal(20)
          expect(actual.eventResults[0][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.eventResults[0][0].hostname).to.be.a('string')
          expect(actual.eventResults[0][0].pid).to.be.a('number')
          expect(actual.eventResults[0][0].time).to.be.a('number')

          expect(actual.eventResults[1][1]).to.deep.equal({ two: 'two' })
          expect(actual.eventResults[1][0].event).to.equal('foo_bar')
          expect(actual.eventResults[1][0].category).to.equal('info')
          expect(actual.eventResults[1][0].level).to.equal(30)
          expect(actual.eventResults[1][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.eventResults[1][0].hostname).to.be.a('string')
          expect(actual.eventResults[1][0].pid).to.be.a('number')
          expect(actual.eventResults[1][0].time).to.be.a('number')
        },
        'I should be able to subscribe to the levels': (expect) => (err, actual) => {
          expect(err).to.equal(null)
          expect(actual.noSubscriberResults.length).to.equal(0)
          expect(actual.levelResults.length).to.equal(2)

          expect(actual.levelResults[0][1]).to.deep.equal({ two: 'two' })
          expect(actual.levelResults[0][0].event).to.equal('foo_bar')
          expect(actual.levelResults[0][0].category).to.equal('debug')
          expect(actual.levelResults[0][0].level).to.equal(20)
          expect(actual.levelResults[0][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.levelResults[0][0].hostname).to.be.a('string')
          expect(actual.levelResults[0][0].pid).to.be.a('number')
          expect(actual.levelResults[0][0].time).to.be.a('number')

          expect(actual.levelResults[1][1]).to.deep.equal({ two: 'two' })
          expect(actual.levelResults[1][0].event).to.equal('foo_bar')
          expect(actual.levelResults[1][0].category).to.equal('info')
          expect(actual.levelResults[1][0].level).to.equal(30)
          expect(actual.levelResults[1][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.levelResults[1][0].hostname).to.be.a('string')
          expect(actual.levelResults[1][0].pid).to.be.a('number')
          expect(actual.levelResults[1][0].time).to.be.a('number')
        },
        'I should be able to subscribe to everything (wildcard)': (expect) => (err, actual) => {
          expect(err).to.equal(null)
          expect(actual.noSubscriberResults.length).to.equal(0)
          expect(actual.wildcardResults.length).to.equal(2)

          expect(actual.wildcardResults[0][1]).to.deep.equal({ two: 'two' })
          expect(actual.wildcardResults[0][0].event).to.equal('foo_bar')
          expect(actual.wildcardResults[0][0].category).to.equal('debug')
          expect(actual.wildcardResults[0][0].level).to.equal(20)
          expect(actual.wildcardResults[0][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.wildcardResults[0][0].hostname).to.be.a('string')
          expect(actual.wildcardResults[0][0].pid).to.be.a('number')
          expect(actual.wildcardResults[0][0].time).to.be.a('number')

          expect(actual.wildcardResults[1][1]).to.deep.equal({ two: 'two' })
          expect(actual.wildcardResults[1][0].event).to.equal('foo_bar')
          expect(actual.wildcardResults[1][0].category).to.equal('info')
          expect(actual.wildcardResults[1][0].level).to.equal(30)
          expect(actual.wildcardResults[1][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.wildcardResults[1][0].hostname).to.be.a('string')
          expect(actual.wildcardResults[1][0].pid).to.be.a('number')
          expect(actual.wildcardResults[1][0].time).to.be.a('number')
        },
      },
      'when I emit an event that has no subscriptions': {
        when: (emitter) => {
          const results = []
          const noSubscriberResults = []
          emitter.on('no_listeners', (...args) => noSubscriberResults.push(args))
          emitter.emit('foo_bar', 'debug', { two: 'two' })

          return { results, noSubscriberResults }
        },
        'it should behave like a standard EventEmitter': (expect) => (err, actual) => {
          expect(err).to.equal(null)
          expect(actual.results.length).to.equal(0)
          expect(actual.noSubscriberResults.length).to.equal(1)
          expect(actual.noSubscriberResults[0][1]).to.deep.equal({ two: 'two' })
          expect(actual.noSubscriberResults[0][0].event).to.equal('foo_bar')
          expect(actual.noSubscriberResults[0][0].category).to.equal('debug')
          expect(actual.noSubscriberResults[0][0].level).to.equal(20)
          expect(actual.noSubscriberResults[0][0].source).to.include('polyn-logger/index.test.js')
          expect(actual.noSubscriberResults[0][0].hostname).to.be.a('string')
          expect(actual.noSubscriberResults[0][0].pid).to.be.a('number')
          expect(actual.noSubscriberResults[0][0].time).to.be.a('number')
        },
      },
    },
    'given try-with-metrics': {
      given: () => ({ emitter: new LogEmitter() }),
      'when an action succeeds': {
        when: async ({ emitter }) => {
          const results = []
          const categories = []
          const sleepTime = 5
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
          expect(found.log.duration.milliseconds).to.be.greaterThan(actual.sleepTime)
        }
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
        }
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
    },
  })
}
