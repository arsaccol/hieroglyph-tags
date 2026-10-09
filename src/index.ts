import { HieroglyphTag, defineEgyptianHieroglyph } from './element.js'
export { HieroglyphTag, defineEgyptianHieroglyph }
export { convertMdcToUnicode } from './core.js'
export type { MdcConversion } from './core.js'
if (typeof customElements !== 'undefined') defineEgyptianHieroglyph()
