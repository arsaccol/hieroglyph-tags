// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { convertMdcToUnicode } from '../src/core.js'
import { HieroglyphTag, defineEgyptianHieroglyph } from '../src/index.js'
import { loadHieroglyphicFont, renderHieroglyphicUnicode } from '../src/hierojax/renderer.js'

vi.mock('../src/hierojax/renderer.js', () => ({
  loadHieroglyphicFont: vi.fn(), renderHieroglyphicUnicode: vi.fn(),
}))
const font = vi.mocked(loadHieroglyphicFont)
const render = vi.mocked(renderHieroglyphicUnicode)
const clipboard = vi.fn()
function tag(source = '  A1:O1  '): HieroglyphTag {
  const element = document.createElement('hieroglyph-tag')
  element.textContent = source
  document.body.append(element)
  return element
}
function buttons(element: HieroglyphTag): HTMLButtonElement[] {
  return [...element.shadowRoot!.querySelectorAll('button')]
}
beforeEach(() => {
  font.mockResolvedValue(undefined)
  render.mockImplementation(host => host.replaceChildren(document.createElementNS('http://www.w3.org/2000/svg', 'svg')))
  clipboard.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboard }, configurable: true })
})
afterEach(() => { document.body.replaceChildren(); vi.resetAllMocks() })

describe('native custom element', () => {
  it('registers once and preserves source with output only in its shadow', async () => {
    defineEgyptianHieroglyph()
    expect(customElements.get('hieroglyph-tag')).toBe(HieroglyphTag)
    const element = tag()
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(element.textContent).toBe('  A1:O1  ')
    expect(element.querySelector('svg')).toBeNull()
    expect(element.shadowRoot!.querySelector('svg')).not.toBeNull()
    expect(element.shadowRoot!.querySelector('slot')).toBeNull()
    expect(render.mock.calls[0][1]).toBe(convertMdcToUnicode('A1:O1').unicode)
  })
  it('copies normalized MdC and exact canonical Unicode', async () => {
    const element = tag()
    await vi.waitFor(() => expect(render).toHaveBeenCalled())
    buttons(element)[0].click()
    await vi.waitFor(() => expect(clipboard).toHaveBeenLastCalledWith('A1:O1'))
    buttons(element)[1].click()
    await vi.waitFor(() => expect(clipboard).toHaveBeenLastCalledWith('𓀀𓐰𓉐'))
  })
  it('copies a fresh source immediately without waiting for pending font work', async () => {
    font.mockReturnValue(new Promise<void>(() => {}))
    const element = tag('A1')
    element.textContent = 'W24*Z7'
    buttons(element)[1].click()
    await vi.waitFor(() => expect(clipboard).toHaveBeenCalledWith('𓏌𓐱𓏲'))
    expect(render).not.toHaveBeenCalled()
  })
  it('contains invalid input and allows copying its MdC', async () => {
    const bad = tag('A999')
    tag('anx')
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    expect(bad.shadowRoot!.querySelector('[role="alert"]')!.textContent).toMatch(/Unknown sign/)
    expect(bad.textContent).toBe('A999')
    expect(buttons(bad)[1].disabled).toBe(true)
    buttons(bad)[0].click()
    await vi.waitFor(() => expect(clipboard).toHaveBeenCalledWith('A999'))
  })
  it('rerenders on text content and nested character data mutations', async () => {
    const element = tag()
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1))
    element.textContent = 'W24*Z7'
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(2))
    expect(render.mock.calls[1][1]).toBe(convertMdcToUnicode('W24*Z7').unicode)
    element.firstChild!.textContent = 'anx'
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(3))
    expect(render.mock.calls[2][1]).toBe('𓋹')
  })
  it('discards older async work when a newer font promise resolves first', async () => {
    let oldReady!: () => void
    let newReady!: () => void
    font.mockReturnValueOnce(new Promise<void>(resolve => { oldReady = resolve }))
      .mockReturnValueOnce(new Promise<void>(resolve => { newReady = resolve }))
    const element = tag()
    element.textContent = 'W24*Z7'
    await vi.waitFor(() => expect(font).toHaveBeenCalledTimes(2))
    newReady()
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    oldReady()
    await Promise.resolve()
    expect(render).toHaveBeenCalledOnce()
    expect(render.mock.calls[0][1]).toBe(convertMdcToUnicode('W24*Z7').unicode)
  })
  it('cancels rendering on disconnect and renders again on reconnect', async () => {
    let ready!: () => void
    font.mockReturnValue(new Promise<void>(resolve => { ready = resolve }))
    const element = tag()
    element.remove()
    ready()
    await Promise.resolve()
    expect(render).not.toHaveBeenCalled()
    document.body.append(element)
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
  })
  it('invalid updates invalidate pending valid output', async () => {
    let ready!: () => void
    font.mockReturnValue(new Promise<void>(resolve => { ready = resolve }))
    const element = tag()
    element.textContent = 'A999'
    await vi.waitFor(() => expect(buttons(element)[1].disabled).toBe(true))
    ready()
    await Promise.resolve()
    expect(render).not.toHaveBeenCalled()
    expect(element.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull()
  })
  it('keeps Unicode copy available if font loading fails and can recover', async () => {
    font.mockRejectedValueOnce(new Error('font unavailable'))
    const element = tag()
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull())
    buttons(element)[1].click()
    await vi.waitFor(() => expect(clipboard).toHaveBeenCalledWith('𓀀𓐰𓉐'))
    element.textContent = 'anx'
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
  })
  it('handles renderer and clipboard failures accessibly', async () => {
    render.mockImplementationOnce(() => { throw new Error('render failed') })
    clipboard.mockRejectedValueOnce(new Error('denied'))
    const element = tag()
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('[role="alert"]')).not.toBeNull())
    buttons(element)[0].click()
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('[role="status"]')!.textContent).toMatch(/Copy failed/))
  })
  it('does not render empty input and recovers after clearing', async () => {
    const element = tag('   ')
    expect(render).not.toHaveBeenCalled()
    expect(buttons(element)[1].disabled).toBe(true)
    element.textContent = 'A1'
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce())
    element.textContent = ''
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('svg')).toBeNull())
  })
})
