import { syntax, fontUrl } from './upstream.js';
let fontReady;
export function loadHieroglyphicFont() {
    if (!fontReady) {
        fontReady = (async () => {
            const font = new FontFace('Hieroglyphic', `url("${fontUrl}")`);
            document.fonts.add(await font.load());
        })().catch(error => {
            fontReady = undefined;
            throw error;
        });
    }
    return fontReady;
}
/** The caller must await font readiness before glyph measurement. */
export function renderHieroglyphicUnicode(host, unicode, fontsize) {
    const content = document.createDocumentFragment();
    for (const line of unicode.split('\n')) {
        const row = document.createElement('div');
        row.style.minHeight = '1.5em';
        if (line)
            syntax.parse(line).print(row, {
                type: 'svg', dir: 'hlr', fontsize, signcolor: 'currentColor',
                bracketcolor: 'currentColor', separated: 'true',
            });
        content.appendChild(row);
    }
    host.replaceChildren(content);
}
//# sourceMappingURL=renderer.js.map