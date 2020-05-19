module.exports = (test, dependencies) => {
  'use strict'

  const { LogEmitter } = dependencies

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
    }
  })
}
