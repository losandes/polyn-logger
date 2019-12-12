module.exports = {
  name: 'error-formatter',
  dependencies: [],
  factory: () => {
    'use strict'

    const ERR_EXP = /^err$|error/i
    const isError = (prop) => prop && (prop instanceof Error || (prop.message && prop.stack))
    const isErrorProp = (key, prop) => prop && (prop instanceof Error || (ERR_EXP.test(key) && prop.message && prop.stack))

    const shallowClone = (log) => {
      return Object.keys(log).reduce((clone, key) => {
        if (isErrorProp(key, log[key])) {
          clone[key] = cloneError(log[key])
        } else {
          clone[key] = log[key]
        }

        return clone
      }, {})
    }

    const cloneError = (err) => {
      return Object.keys(err).reduce((clone, key) => {
        clone[key] = err[key]
        return clone
      }, {
        message: err.message,
        stack: err.stack,
      })
    }

    const errorFormatter = {
      format: (log) => {
        if (isError(log)) {
          return cloneError(log)
        }

        return shallowClone(log)
      },
      isError,
      isErrorProp,
    }

    return { errorFormatter }
  },
}
