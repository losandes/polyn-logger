module.exports = {
  name: 'error-formatter',
  dependencies: ['@polyn/blueprint'],
  factory: (polynBp) => {
    'use strict'

    const { is } = polynBp
    const ERR_EXP = /^err$|error/i
    const isError = (prop) => prop && (prop instanceof Error || (prop.message && prop.stack))
    const isErrorProp = (key, prop) => prop && (prop instanceof Error || (ERR_EXP.test(key) && prop.message && prop.stack))
    const findErrorProperties = (log) => Object.keys(log).filter((key) => isErrorProp(key, log[key]))

    const shallowClone = (errorProps, log) => Object.keys(log).reduce((clone, key) => {
      if (errorProps.includes(key)) {
        clone[key] = cloneError(log[key])
      } else {
        clone[key] = log[key]
      }

      return clone
    }, {})

    const cloneError = (err) => Object.keys(err).reduce((clone, key) => {
      clone[key] = err[key]
      return clone
    }, {
      message: err.message,
      stack: err.stack,
    })

    const format = (log) => {
      if (is.array(log)) {
        return log.map(format)
      } else if (is.primitive(log)) {
        return log
      } else if (isError(log)) {
        return cloneError(log)
      }

      const errorProps = findErrorProperties(log)

      if (errorProps.length) {
        return shallowClone(errorProps, log)
      }

      return log
    }

    const errorFormatter = { format, isError, isErrorProp }

    return { errorFormatter }
  },
}
