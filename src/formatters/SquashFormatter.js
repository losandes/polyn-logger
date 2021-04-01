/**
 * @param {@polyn/blueprint} blueprint
 */
function SquashFormatterFactory (deps) {
  'use strict'

  const { is } = deps.blueprint
  const ARRAY_PREFIX = 'arr'
  const ERROR_PREFIX = 'err'
  const CAUSE_PREFIX = 'err_cause'
  const ERR_EXP = /^(e|err)$|error/i
  const isError = (prop) => prop && (prop instanceof Error || (prop.message && prop.stack))
  const isErrorProp = (key, prop) => prop && (prop instanceof Error || (ERR_EXP.test(key) && prop.message && prop.stack))
  const PRIMITIVES = [
    'boolean',
    'null',
    'undefined',
    'number',
    'bigint',
    'string',
    'symbol',
  ]

  /**
   * Checks to see if an array has only primitive values in it
   */
  const isArrayOfPrimitives = (input) => {
    return input.filter((i) => !PRIMITIVES.includes(is.getType(i))).length === 0
  }

  /**
   * Guarantees primite values, or an array of primitive values
   */
  const guaranteePrimitive = (input, depth = 0) => {
    if (Array.isArray(input) && depth === 0) {
      return input.map((item) => guaranteePrimitive(item, depth + 1))
    } else if (Array.isArray(input)) {
      return JSON.stringify(input)
    }

    return PRIMITIVES.includes(is.getType(input))
      ? input
      : JSON.stringify(input)
  }

  /**
   * Flattens error objects, and clones them to regular objects that can be
   * printed. If the error(s) have causes, it also flattens the causes, so
   * log details are not lost by logstash.
   */
  const errorFormatter = {
    format: (err, depth = 0) => {
      const base = {}

      if (depth === 0) {
        base.message = guaranteePrimitive(err.message)
        base[`${ERROR_PREFIX}_message`] = base.message
        base[`${ERROR_PREFIX}_stack`] = guaranteePrimitive(err.stack)
      } else {
        base[`${CAUSE_PREFIX}${depth}_message`] = guaranteePrimitive(err.message)
        base[`${CAUSE_PREFIX}${depth}_stack`] = guaranteePrimitive(err.stack)
      }

      return Object.keys(err).reduce((error, key) => {
        if (key === 'cause') {
          const _newDepth = depth + 1
          let _cause

          if (err.cause && typeof err.cause.message === 'string') {
            _cause = errorFormatter.format(err.cause, _newDepth)
          } else if (typeof err.cause === 'function') {
            // for VError (only used on OneDrive and we should phase it out!)
            _cause = errorFormatter.format(err.cause(), _newDepth)
          }

          if (_cause) {
            Object.keys(_cause).forEach((key) => {
              error[key] = guaranteePrimitive(_cause[key])
            })
          }
        } else if (depth === 0) {
          error[findUnusedKey(base, `${ERROR_PREFIX}_${key}`, null)] = guaranteePrimitive(err[key])
        } else {
          error[`${CAUSE_PREFIX}${depth}_${key}`] = guaranteePrimitive(err[key])
        }

        return error
      }, base)
    },
  } // /errorFormatter

  /**
   * Adds the parent prefix if one is present (i.e. parent node name for nested objects)
   */
  const addParentKeyPrefix = (key, parent) =>
    parent && typeof parent === 'string' && parent.length
      ? `${parent}_${key}`
      : key

  /**
   * Helps prevent overwriting values that have the same key on nested objects.
   * For instance, if a log contains a `message`, and also has an error on it,
   * there will be 2 properties with the `message` key. This will make sure both
   * make it into the logs.
   */
  const findUnusedKey = (obj, key, parent, idx = 0) => {
    const hasParent = typeof parent === 'string' && parent.length

    if (idx === 0 && hasParent) {
      const keyWithParent = addParentKeyPrefix(key, parent)

      if (obj[keyWithParent]) {
        return findUnusedKey(obj, keyWithParent)
      }

      return keyWithParent
    } else if (idx === 0) {
      if (obj[key]) {
        return findUnusedKey(obj, key, null, idx + 1)
      }

      return key
    } else if (obj[key]) {
      return findUnusedKey(obj, key, idx + 1)
    } else {
      return key
    }
  }

  /**
   * Recursively flattens the log, so logstash will accept it, and the values
   * will be searchable in Kibana
   */
  const logFormatter = {
    format: (log, depth = 0, parent = '') => {
      if (is.primitive(log)) {
        return { message: log }
      } else if (Array.isArray(log) && isArrayOfPrimitives(log)) {
        return { values: log }
      } else if (Array.isArray(log)) {
        return log.reduce((all, one, idx) => {
          const formatted = logFormatter.format(one)
          Object.keys(formatted).forEach((key) => {
            // const _key = addParentKeyPrefix(key, parent)
            //   .replace(KEY_PREFIX_EXPRESSION, `${ARRAY_PREFIX}_${idx}_`)
            const _key = `${ARRAY_PREFIX}_${idx}_${addParentKeyPrefix(key, parent)}`
            all[_key] = formatted[key]
          })

          return all
        }, {})
      } else if (isError(log)) {
        return errorFormatter.format(log)
      } else {
        return Object.keys(log).reduce((output, key) => {
          if (is.primitive(log[key])) {
            output[findUnusedKey(output, key, parent)] = log[key]
          } else if (Array.isArray(log[key])) {
            output[findUnusedKey(output, key, parent)] = log[key].map(guaranteePrimitive)
          } else if (isErrorProp(key, log[key])) {
            const formatted = errorFormatter.format(log[key])
            Object.keys(formatted).forEach((key) => {
              if (key === 'message' && (log.message || output.message)) {
                // favor `[log|output].message` - the error message is also available on `app_err_message`
              } else {
                // use a depth of 1 because the error message was already prefixed by `errorFormatter.format`
                output[findUnusedKey(output, key, parent, 1)] = formatted[key]
              }
            })
          } else {
            const _key = depth === 0 ? `${key}` : key
            const newDepth = depth + 1
            const formatted = logFormatter.format(
              log[key],
              newDepth,
              addParentKeyPrefix(_key, parent),
            )

            Object.keys(formatted).forEach((key) => {
              output[key] = formatted[key]
            })
          }

          return output
        }, {})
      }
    },
  } // /logFormatter

  /**
   * Merges the log meta with the log in a recursively flattened object so
   * all values are on a single plane
   */
  function SquashFormatter () {
    /**
     * Formats the log, and metadata
     * @param {any} log - the log to write
     * @param {LogMeta} meta - the log metadata
     */
    const format = async (log, meta) => {
      try {
        const _meta = { ...meta }
        delete _meta.context

        return JSON.stringify({
          ...logFormatter.format({ ..._meta, ...meta.context }),
          ...logFormatter.format(log),
        })
      } catch (e) {
        try {
          return JSON.stringify({
            ...meta,
            ...log,
            ...{
              _err_message: e.message,
              _err_stack: e.stack,
            },
          })
        } catch (ignored) {
          try {
            return JSON.stringify({
              event: 'log_format_error',
              category: 'error',
              level: 50,
              _err_message: e.message,
              _err_stack: e.stack,
            })
          } catch (ignored2) {
            // never lose the fact that logging is failing
            // (although logstash happily fails silently if the formatting isn't what it wants)
            return JSON.stringify({
              event: 'log_format_error',
              category: 'error',
              level: 50,
            })
          }
        }
      }
    }

    return { format }
  }

  return { SquashFormatter }
}

module.exports = SquashFormatterFactory
