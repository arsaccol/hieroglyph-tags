# Third-party components

hieroglyph-tags is GPL-3.0-only; see LICENSE.

## Inpu MdC adapter

The converter and converter tests are adapted from arsaccol/inpu, licensed
GPL-3.0-only, https://github.com/arsaccol/inpu, revision
`7312bd7258d2b4916ebc3949db0d88fb5114eece`. The original validation and warning
behavior is preserved; imports use this package's upstream boundary. The renderer
adapts its font-ready SVG approach to native Web Components.

## HieroJax

- Author: Mark-Jan Nederhof, https://github.com/nederhof/hierojax.
- Pinned revision: `da318801e00b10b4b5c5ec8d9cc6f8fddcc9eb5a`.
- License: GPL-3.0, full text in `vendor/hierojax/LICENSE`.
- Runtime, CSS, source grammars, and narrow type declarations: `vendor/hierojax/`.

The runtime is copied unchanged from Inpu's pinned assembly. Original source
comments and source boundaries remain intact. The assembly concatenates upstream
sources in build order, removes generated CommonJS CLI footers, and adds ESM
exports. Upstream automatic font loading and conversion-page handlers are excluded.
No conversion or layout algorithm is rewritten. Shadow styles reproduce the
upstream CSS without its @font-face rule; FontFace loads the same unchanged font.

To reproduce the assembly, check out the exact HieroJax revision, then run:

```sh
node scripts/vendor-hierojax.mjs /path/to/hierojax /path/to/newgardiner/fonts/OFL.txt
npm run build
```

Use NewGardiner revision `a377a60086b2c3ad9098788515d1fa1caa4ad9ba` for the
font license text. The adaptation script and TypeScript sources ship with the
package alongside the original grammar files and assembled source runtime.

## NewGardiner font

Copyright (c) 2020, Mark-Jan Nederhof. Reserved Font Name: NewGardiner.
Project: https://github.com/nederhof/newgardiner.
License: SIL Open Font License 1.1, including the notice in
`vendor/hierojax/OFL.txt`. `vendor/hierojax/NewGardiner.otf` is unchanged from the
pinned HieroJax checkout. It ships as a separate runtime asset, not inline data.
