import { afterEach, expect, it, vi } from 'vitest'
import { convertMdcToUnicode } from '../src/core.js'
import { MdcFragment, syntax } from '../src/hierojax/upstream.js'
afterEach(() => vi.restoreAllMocks())
it.each(['\uFFFD', '\uE000', '\u{F0000}', '\u{100000}'])('rejects unsupported upstream output %s', unicode => {
  vi.spyOn(MdcFragment.prototype, 'toString').mockReturnValue(unicode)
  expect(() => convertMdcToUnicode('A1')).toThrow(/without a supported Unicode mapping/)
})
it('rejects output that the Unicode renderer cannot parse', () => {
  vi.spyOn(syntax, 'parse').mockImplementation(() => { throw new Error('invalid structure') })
  expect(() => convertMdcToUnicode('A1')).toThrow(/invalid MdC/)
})
it('normalizes CRLF and reports line numbers', () => {
  expect(convertMdcToUnicode('A1\r\nanx').unicode).toBe('𓀀\n𓋹')
  expect(() => convertMdcToUnicode('A1\nA999')).toThrow(/Line 2.*Unknown sign/)
})
