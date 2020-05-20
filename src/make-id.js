function MakeIdFactory () {
  'use strict'

  const ALPHA_NUM = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const templates = {}

  const makeTemplate = (length = 8) => {
    if (!templates[`l${length}`]) {
      if (length < 1) {
        throw new Error('Invalid id length: expected length to be a number greater than 0')
      }

      templates[`l${length}`] = new Array(length + 1).join('x')
    }

    return templates[`l${length}`]
  }

  const _rand = (min, max) => () => (Math.random() * (max - min + 1)) << 0
  const rand = _rand(0, ALPHA_NUM.length - 1)

  /**
   * Makes a random hex string of a given length
   * @param length {number?} - the length of the random string
   * @returns {string} - a random string (i.e. "4e42a851")
   */
  const makeId = (length) => makeTemplate(length)
    .replace(/x/g, () => ALPHA_NUM[rand()])

  return { makeId }
}

module.exports = MakeIdFactory
