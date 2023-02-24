import { expect } from 'chai'
import supposed from 'supposed'
import polynLogger from '@polyn/logger'

export default supposed.Suite({
  name: 'polyn-logger (mjs default)',
  assertionLibrary: expect,
  inject: polynLogger,
}).runner()
  .run()
