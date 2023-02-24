import cjsModule from './index.cjs'

export const LogEmitter = cjsModule.LogEmitter
export const writers = cjsModule.writers
export const formatters = cjsModule.formatters
export const METRICS_CATEGORIES = cjsModule.METRICS_CATEGORIES

export default {
  LogEmitter,
  writers,
  formatters,
  METRICS_CATEGORIES,
}
