import { convertMdcToUnicode } from './core.js'
import { loadHieroglyphicFont, renderHieroglyphicUnicode } from './hierojax/renderer.js'
import { hierojaxStyles } from './hierojax/styles.js'

// Importing in Node is harmless; only the core entry is promised DOM independent.
const ElementBase = typeof HTMLElement === 'undefined' ? class {} as typeof HTMLElement : HTMLElement

export class HieroglyphTag extends ElementBase {
  private source = ''
  private unicode = ''
  private generation = 0
  private observer: MutationObserver
  private output: HTMLDivElement
  private status: HTMLSpanElement
  private unicodeButton: HTMLButtonElement

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = hierojaxStyles + `
      :host { display: inline-block; color: inherit; vertical-align: middle; position: relative; }
      .output { direction: ltr; }
      svg { vertical-align: middle; }
      .controls { position: absolute; z-index: 10; top: 100%; left: 0; display: flex;
        gap: .25rem; padding: .3rem; border-radius: .3rem; background: Canvas; color: CanvasText;
        border: 1px solid currentColor; opacity: 0; pointer-events: none; }
      :host(:hover) .controls, :host(:focus-within) .controls { opacity: 1; pointer-events: auto; }
      button { font: 12px system-ui; white-space: nowrap; cursor: pointer; padding: .3em .5em; }
      button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
      .status { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden;
        clip-path: inset(50%); white-space: nowrap; }
      .error { font: 12px system-ui; border-bottom: 1px dotted currentColor; }
      @media (hover: none) { .controls { position: static; opacity: 1; pointer-events: auto; } }
    `
    this.output = document.createElement('div')
    this.output.className = 'output'
    this.output.setAttribute('role', 'img')
    const controls = document.createElement('div')
    controls.className = 'controls'
    const mdcButton = document.createElement('button')
    mdcButton.type = 'button'
    mdcButton.textContent = 'Copy MdC'
    mdcButton.addEventListener('click', () => { void this.copy('mdc') })
    this.unicodeButton = document.createElement('button')
    this.unicodeButton.type = 'button'
    this.unicodeButton.textContent = 'Copy Unicode'
    this.unicodeButton.disabled = true
    this.unicodeButton.addEventListener('click', () => { void this.copy('unicode') })
    controls.append(mdcButton, this.unicodeButton)
    this.status = document.createElement('span')
    this.status.className = 'status'
    this.status.setAttribute('role', 'status')
    this.status.setAttribute('aria-live', 'polite')
    shadow.append(style, this.output, controls, this.status)
    this.observer = new MutationObserver(() => { void this.update() })
  }

  connectedCallback(): void {
    this.observer.observe(this, { childList: true, characterData: true, subtree: true })
    void this.update()
  }

  disconnectedCallback(): void {
    this.observer.disconnect()
    this.generation++
  }

  private async update(): Promise<void> {
    const generation = ++this.generation
    const source = (this.textContent ?? '').trim()
    this.source = source
    this.unicode = ''
    this.unicodeButton.disabled = true
    this.output.replaceChildren()
    this.output.className = 'output'
    this.output.setAttribute('role', 'img')
    this.output.setAttribute('aria-label', source ? `Hieroglyphs: ${source}` : 'Empty hieroglyphs')
    this.output.removeAttribute('title')
    this.output.setAttribute('aria-busy', 'false')
    this.status.textContent = ''
    try {
      const result = convertMdcToUnicode(source)
      this.unicode = result.unicode
      this.unicodeButton.disabled = !result.unicode
      if (result.warnings.length) this.output.title = result.warnings.join(' ')
      if (!result.unicode) return
      this.output.setAttribute('aria-busy', 'true')
      this.status.textContent = 'Loading hieroglyphs…'
      await loadHieroglyphicFont()
      // Compare the live source as well: MutationObserver may not yet have fired.
      if (generation !== this.generation || !this.isConnected || source !== (this.textContent ?? '').trim()) return
      const fontsize = parseFloat(getComputedStyle(this).fontSize) || 16
      renderHieroglyphicUnicode(this.output, result.unicode, fontsize)
      this.output.setAttribute('aria-busy', 'false')
      this.status.textContent = result.warnings.join(' ')
    } catch (error) {
      if (generation !== this.generation || !this.isConnected || source !== (this.textContent ?? '').trim()) return
      const message = this.unicode
        ? 'Preview unavailable. Unicode is still available to copy.'
        : error instanceof Error ? error.message : 'Invalid MdC.'
      this.output.replaceChildren()
      this.output.className = 'output error'
      this.output.setAttribute('role', 'alert')
      this.output.removeAttribute('aria-label')
      this.output.setAttribute('aria-busy', 'false')
      this.output.textContent = message
      this.output.title = message
      this.status.textContent = message
    }
  }

  private async copy(kind: 'mdc' | 'unicode'): Promise<void> {
    // Read current light DOM to avoid copying stale state during a mutation turn.
    const source = (this.textContent ?? '').trim()
    if (source !== this.source) void this.update()
    const text = kind === 'mdc' ? source : this.unicode
    if (kind === 'unicode' && !text) return
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      this.status.textContent = kind === 'mdc' ? 'MdC copied.' : 'Unicode copied.'
    } catch {
      this.status.textContent = 'Copy failed. Clipboard access is unavailable.'
    }
  }
}

export function defineEgyptianHieroglyph(): void {
  if (!customElements.get('hieroglyph-tag')) customElements.define('hieroglyph-tag', HieroglyphTag)
}

declare global {
  interface HTMLElementTagNameMap { 'hieroglyph-tag': HieroglyphTag }
}
