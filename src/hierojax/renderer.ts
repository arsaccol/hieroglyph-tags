import { syntax, fontUrl } from './upstream.js'

let fontReady: Promise<void> | undefined

export function loadHieroglyphicFont(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      const font = new FontFace('Hieroglyphic', `url("${fontUrl}")`)
      document.fonts.add(await font.load())
    })().catch(error => {
      fontReady = undefined
      throw error
    })
  }
  return fontReady
}

/** The caller must await font readiness before glyph measurement. */
export function renderHieroglyphicUnicode(host: HTMLElement, unicode: string, fontsize: number): void {
  const content = document.createDocumentFragment()
  for (const line of unicode.split('\n')) {
    const row = document.createElement('div')
    row.style.minHeight = '1.5em'
    if (line) syntax.parse(line).print(row, {
      type: 'svg', dir: 'hlr', fontsize, signcolor: 'currentColor',
      bracketcolor: 'currentColor', separated: 'true',
    })
    content.appendChild(row)
  }
  host.replaceChildren(content)
}
