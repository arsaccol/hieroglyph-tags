# hieroglyph-tags

Write Manuel de Codage directly in HTML and render it as properly composed
Egyptian hieroglyphs. Native Web Components, powered by HieroJax.

```html
<script type="module" src="./node_modules/hieroglyph-tags/dist/index.js"></script>
<p>The inscription reads <hieroglyph-tag>A1:O1</hieroglyph-tag>.</p>
```

Serve the page over HTTP. The same module URL works from a CDN: use the package's
`dist/index.js` URL and retain the package's `vendor/` assets at their relative
paths. No framework or additional stylesheet is required.

```sh
npm install hieroglyph-tags
```

```js
import 'hieroglyph-tags'
```

The singular `<hieroglyph-tag>` reads its light-DOM text, trims outer whitespace,
and keeps that source intact. SVG and buttons live in its Shadow DOM. It inherits
text color and uses the surrounding font size; set `font-size: 48px` for larger
examples. Newlines create separate rows. Changing `textContent` rerenders:

```js
document.querySelector('hieroglyph-tag').textContent = 'W24*Z7'
```

Hover or Tab to reveal **Copy MdC** and **Copy Unicode**. Touch devices show the
buttons directly. Copy Unicode preserves the converter's exact canonical string,
including Egyptian Hieroglyph Format Controls. Clipboard access requires a secure
context (HTTPS or localhost) and browser permission. Failures are announced in an
accessible status. Invalid input displays a local error and disables Unicode
copy. Rendering failures still allow copying successfully converted Unicode.
Known conversion warnings are available as the output's title and live status.

## Conversion API

```js
import { convertMdcToUnicode } from 'hieroglyph-tags/core'
const { unicode, warnings } = convertMdcToUnicode('A1:O1')
// U+13000 U+13430 U+13250
```

This synchronous entry point requires no DOM, font, or element registration.
Invalid input throws an Error with a line number. Empty input yields empty Unicode
and warnings. The root entry auto-registers the element; explicit idempotent
`defineEgyptianHieroglyph()` is also exported.

Compatibility follows the pinned HieroJax MdC/JSesh subset: Gardiner codes,
aliases such as `anx`, joins, groups, enclosures, overlays, mirroring, and lost
signs. Scaling and colors may be omitted; rotations, insertions and ligatures may
be approximate. Warnings cover known losses and do not guarantee every unwarned
construct is lossless. Unknown signs, text annotations, private-use/replacement
characters and invalid Unicode structures are rejected.

## Develop and verify

```sh
npm install
npm run dev
# Open http://127.0.0.1:4173/demo/index.html
npm test
npm run lint
npm run build
npm run preview
# Built demo: http://127.0.0.1:4173/dist/demo/index.html
npx playwright install chromium
npm run test:browser
npm pack --dry-run
```

The dev command compiles and watches TypeScript; refresh the plain HTML demo after
edits. Unit tests mock layout. The Chromium smoke test packs and extracts the
actual distribution into a fresh vanilla consumer, loads the font and SVG, and
checks hover/focus controls, clipboard data, invalid input and dynamic changes.
It also builds a Vite consumer and checks both source and built demo pages.
Manually check current Firefox and Safari for composition appearance, multiline
layout, inherited colors, keyboard navigation, touch controls and clipboard
permissions. Font sizing changes after connection require a source update or
reconnection to regenerate layout.

## License and upstream

GPL-3.0-only. See LICENSE and [THIRD_PARTY.md](THIRD_PARTY.md). HieroJax and
NewGardiner are authored by Mark-Jan Nederhof; the font uses SIL OFL 1.1.
The MdC converter is adapted from [Inpu](https://github.com/arsaccol/inpu).
HieroJax is currently vendored at revision
`da318801e00b10b4b5c5ec8d9cc6f8fddcc9eb5a`. Only
`src/hierojax/upstream.ts` imports it directly, allowing a future npm dependency
to replace vendoring. Keep `dist/` and `vendor/` together when hosting the package.
