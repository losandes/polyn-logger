module.exports = (test, dependencies) => {
  'use strict'

  const { SquashFormatter } = dependencies.formatters

  class AccessDeniedError extends Error {
    constructor (message, input) {
      super(message)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, AccessDeniedError)
      }

      this.source = input.source
      this.reason = input.reason
      this.meta = input.meta // teamId?, teamName?
      this.status = input.status || 401
      this.statusMessage = input.status || 'Access Denied'

      if (input.cause && input.cause instanceof Error) {
        this.cause = input.cause
      }

      if (typeof input.clientSafeMessage === 'string') {
        this.clientSafeMessage = input.clientSafeMessage
      }
    }
  }

  return test('given @polyn/logger SquashFormatter', {
    given: () => {
      const { format } = new SquashFormatter()

      const makeMeta = (category) => {
        return {
          event: `${category}_event`,
          category,
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157,
          context: {
            a: 'property',
            nest: {
              nest: {
                nest: 'context'
              }
            }
          }
        }
      }

      const log = async (category, log) => {
        const actual = await format(log, makeMeta(category))
        return {
          actual,
          json: JSON.parse(actual),
        }
      }

      return { log, makeMeta, format }
    },
    'when anything is logged': {
      when: ({ log }) => log('debug', 'hello world'),
      'it should return a string': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(typeof result.actual).to.equal('string')
      },
      'it should return stringified JSON': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(JSON.parse(result.actual)).to.deep.equal({
          message: 'hello world',
          event: 'debug_event',
          category: 'debug',
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157,
          a: 'property',
          nest_nest_nest: 'context'
        })
      },
      'it should convert the event into a level': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(result.json.level).to.equal(20)
      },
    },
    'when a primitive is logged': {
      when: ({ log }) => log('trace', 'hello world'),
      'it should make it the value of `message`': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(result.json).to.deep.equal({
          message: 'hello world',
          event: 'trace_event',
          category: 'trace',
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157,
          a: 'property',
          nest_nest_nest: 'context'
        })
      },
    },
    'when an error is logged': {
      when: ({ log }) => log('error', new Error('BOOM!')),
      'it should log the message, and stack': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect({
          message: result.json.message,
          event: result.json.event,
          category: result.json.category,
          level: result.json.level,
          source: result.json.source,
          hostname: result.json.hostname,
          pid: result.json.pid,
          time: result.json.time,
        }).to.deep.equal({
          message: 'BOOM!',
          event: 'error_event',
          category: 'error',
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157
        })
        expect(result.json.err_stack.indexOf('Error: BOOM!')).to.equal(0)
      },
      'and the error has nested causes': {
        when: ({ log }) => log('error',
          new AccessDeniedError('denied 1', {
            status: 101,
            statusMessage: '101',
            cause: new AccessDeniedError('denied 2', {
              status: 201,
              statusMessage: '201',
              cause: new AccessDeniedError('denied 3', {
                status: 301,
                statusMessage: '301',
                cause: new Error('BOOM!'),
              }),
            }),
          }),
        ),
        'it should log the messages, and stacks of all nested causes': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect({
            message: result.json.message,
            event: result.json.event,
            category: result.json.category,
            level: result.json.level,
            source: result.json.source,
            hostname: result.json.hostname,
            pid: result.json.pid,
            time: result.json.time,
            err_message: result.json.err_message,
            err_status: result.json.err_status,
            err_statusMessage: result.json.err_statusMessage,
            err_cause1_message: result.json.err_cause1_message,
            err_cause1_status: result.json.err_cause1_status,
            err_cause1_statusMessage: result.json.err_cause1_statusMessage,
            err_cause2_message: result.json.err_cause2_message,
            err_cause2_status: result.json.err_cause2_status,
            err_cause2_statusMessage: result.json.err_cause2_statusMessage,
            err_cause3_message: result.json.err_cause3_message,
          }).to.deep.equal({
            message: 'denied 1',
            event: 'error_event',
            category: 'error',
            level: 20,
            source: '/src/app-teams-calls/dist-test/compose.js',
            hostname: 'MACHINE_NAME',
            pid: 34143,
            time: 1580422939157,
            err_message: 'denied 1',
            err_status: 101,
            err_statusMessage: 101,
            err_cause1_message: 'denied 2',
            err_cause1_status: 201,
            err_cause1_statusMessage: 201,
            err_cause2_message: 'denied 3',
            err_cause2_status: 301,
            err_cause2_statusMessage: 301,
            err_cause3_message: 'BOOM!',
          })
          expect(result.json.err_stack.indexOf('Error: denied 1')).to.equal(0)
          expect(result.json.err_cause1_stack.indexOf('Error: denied 2')).to.equal(0)
          expect(result.json.err_cause2_stack.indexOf('Error: denied 3')).to.equal(0)
          expect(result.json.err_cause3_stack.indexOf('Error: BOOM!')).to.equal(0)
        },
      },
      'and the error is a derivitive of Error with additional properties': {
        when: ({ log }) => log('trace',
          new AccessDeniedError('denied 1', { source: 'hello world!' }),
        ),
        'it should log the additional properties with an err prefix': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect({
            source: result.json.source,
            err_source: result.json.err_source,
            err_status: result.json.err_status,
            err_statusMessage: result.json.err_statusMessage,
          }).to.deep.equal({
            source: '/src/app-teams-calls/dist-test/compose.js',
            err_source: 'hello world!',
            err_status: 401,
            err_statusMessage: 'Access Denied',
          })
        },
      },
    },
    'when an object is logged': {
      when: ({ log }) => log('trace', {
        message: 'parent message',
        tags: ['one', 'two', 'three', { four: 4 }, [{ five: 5 }]],
        metadata: {
          message: 'hello world',
          nest: {
            foo: 'bar',
            baz: {
              luhr: 'mann',
              tags: ['one', 'two', 'three', { four: 4 }, [{ five: 5 }]],
            },
          },
        },
        err: new AccessDeniedError('denied', {
          cause: new Error('BOOM!'),
        }),
      }),
      'it should flatten the object, guarantee primitives, and prefix nested properties with `n{{idx}}``': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect({
          message: result.json.message,
          event: result.json.event,
          category: result.json.category,
          level: result.json.level,
          source: result.json.source,
          hostname: result.json.hostname,
          pid: result.json.pid,
          time: result.json.time,
          metadata_message: result.json.metadata_message,
          metadata_nest_foo: result.json.metadata_nest_foo,
          metadata_nest_baz_luhr: result.json.metadata_nest_baz_luhr,
          metadata_nest_baz_tags: result.json.metadata_nest_baz_tags,
          err_message: result.json.err_message,
          err_status: result.json.err_status,
          err_statusMessage: result.json.err_statusMessage,
          err_cause1_message: result.json.err_cause1_message,
        }).to.deep.equal({
          message: 'parent message',
          event: 'trace_event',
          category: 'trace',
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157,
          metadata_message: 'hello world',
          metadata_nest_foo: 'bar',
          metadata_nest_baz_luhr: 'mann',
          metadata_nest_baz_tags: ['one', 'two', 'three', '{"four":4}', '[{"five":5}]'],
          err_message: 'denied',
          err_status: 401,
          err_statusMessage: 'Access Denied',
          err_cause1_message: 'BOOM!'
        })
        expect(result.json.err_stack.indexOf('Error: denied')).to.equal(0)
        expect(result.json.err_cause1_stack.indexOf('Error: BOOM!')).to.equal(0)
      },
      'and it has an error on the `e` property': {
        when: ({ log }) => log('trace', {
          test: 42,
          e: new AccessDeniedError('denied', {
            cause: new Error('BOOM!'),
          }),
        }),
        'it should log the message, and stack': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect({
            message: result.json.message,
            test: result.json.test,
            err_message: result.json.err_message,
            err_cause1_message: result.json.err_cause1_message,
          }).to.deep.equal({
            message: 'denied',
            test: 42,
            err_message: 'denied',
            err_cause1_message: 'BOOM!',
          })
          expect(result.json.err_stack.indexOf('Error: denied')).to.equal(0)
          expect(result.json.err_cause1_stack.indexOf('Error: BOOM!')).to.equal(0)
        },
      },
      'and it has an error on the `err` property': {
        when: ({ log }) => log('trace', {
          test: 42,
          err: new AccessDeniedError('denied', {
            cause: new Error('BOOM!'),
          }),
        }),
        'it should log the message, and stack': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect({
            message: result.json.message,
            test: result.json.test,
            err_message: result.json.err_message,
            err_cause1_message: result.json.err_cause1_message,
          }).to.deep.equal({
            message: 'denied',
            test: 42,
            err_message: 'denied',
            err_cause1_message: 'BOOM!',
          })
          expect(result.json.err_stack.indexOf('Error: denied')).to.equal(0)
          expect(result.json.err_cause1_stack.indexOf('Error: BOOM!')).to.equal(0)
        },
      },
      'and it has an error on the `error` property': {
        when: ({ log }) => log('trace', {
          test: 42,
          error: new AccessDeniedError('denied', {
            cause: new Error('BOOM!'),
          }),
        }),
        'it should log the message, and stack': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect({
            message: result.json.message,
            test: result.json.test,
            err_message: result.json.err_message,
            err_cause1_message: result.json.err_cause1_message,
          }).to.deep.equal({
            message: 'denied',
            test: 42,
            err_message: 'denied',
            err_cause1_message: 'BOOM!',
          })
          expect(result.json.err_stack.indexOf('Error: denied')).to.equal(0)
          expect(result.json.err_cause1_stack.indexOf('Error: BOOM!')).to.equal(0)
        },
      },
      'and it has properties that aren\'t serializable': {
        when: ({ log }) => log('trace', {
          message: 'hello world',
          func: () => {},
        }),
        'it should produce the formatted log without those properties': (expect) => (err, result) => {
          expect(err).to.equal(null)
          expect(result.json).to.deep.equal({
            message: 'hello world',
            event: 'trace_event',
            category: 'trace',
            level: 20,
            source: '/src/app-teams-calls/dist-test/compose.js',
            hostname: 'MACHINE_NAME',
            pid: 34143,
            time: 1580422939157,
            a: 'property',
            nest_nest_nest: 'context'
          })
        },
      },
    },
    'when an array of objects is logged': {
      when: ({ log }) => log('trace', [{
        test: 42,
        hello: 'world!',
        nest: {
          foo: 'bar',
        },
      }, {
        test: 43,
        foo: 'bar',
      }]),
      'it should prefix each flattened object with `{{idx}}`': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(result.json).to.deep.equal({
          event: 'trace_event',
          category: 'trace',
          level: 20,
          source: '/src/app-teams-calls/dist-test/compose.js',
          hostname: 'MACHINE_NAME',
          pid: 34143,
          time: 1580422939157,
          a: 'property',
          nest_nest_nest: 'context',
          arr_0_test: 42,
          arr_0_hello: 'world!',
          arr_0_nest_foo: 'bar',
          arr_1_test: 43,
          arr_1_foo: 'bar',
        })
      },
    },
    'when an array of primitives is logged': {
      when: ({ log }) => log('trace', ['foo', 'bar', 42]),
      'it should put the array on a `values` property': (expect) => (err, result) => {
        expect(err).to.equal(null)
        expect(result.json.values).to.deep.equal(['foo', 'bar', 42])
      },
    },
  })
}
