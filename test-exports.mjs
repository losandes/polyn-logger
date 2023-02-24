import { expect } from 'chai'
import supposed from 'supposed'
import {
  LogEmitter,
  writers,
  formatters,
  METRICS_CATEGORIES,
} from '@polyn/logger'

export default supposed.Suite({
  name: 'polyn-logger (mjs exports)',
  assertionLibrary: expect,
  inject: {
    LogEmitter,
    writers,
    formatters,
    METRICS_CATEGORIES,
  },
}).runner()
  .run()
