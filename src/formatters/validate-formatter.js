module.exports = {
  name: 'validate-formatter',
  dependencies: ['@polyn/blueprint'],
  factory: (polynBp) => {
    'use strict'

    const formatterBp = polynBp.blueprint('Formatter', {
      formatter: {
        format: 'function',
      },
    })

    const validateFormatter = (formatter) => {
      const validation = formatterBp.validate(formatter)

      if (validation.err) {
        throw validation.err
      }

      return validation
    }

    return { validateFormatter }
  },
}
