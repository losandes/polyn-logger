module.exports = {
  name: 'validate-writer',
  dependencies: ['@polyn/blueprint'],
  factory: (polynBp) => {
    'use strict'

    const writerBp = polynBp.blueprint('Formatter', {
      writer: {
        write: 'function',
      },
    })

    const validateWriter = (writer) => {
      const validation = writerBp.validate(writer)

      if (validation.err) {
        throw validation.err
      }

      return validation
    }

    return { validateWriter }
  },
}
