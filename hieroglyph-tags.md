# Codex implementation brief: `hieroglyph-tags`

You are implementing a new standalone JavaScript/TypeScript library called **`hieroglyph-tags`**.

You are starting with no prior conversational context. Treat this document as the complete project brief.

## Goal

Create a framework-independent npm package that lets an ordinary HTML author write Manuel de Codage (MdC) directly in HTML:

```html
<hieroglyph-tag>A1:O1</hieroglyph-tag>
```

and have the browser render properly composed Ancient Egyptian hieroglyphs.

The custom element must also expose two small controls, shown when the user hovers the rendered hieroglyphs or focuses within the component:

- **Copy MdC** — copies the original MdC source, e.g. `A1:O1`
- **Copy Unicode** — copies the corresponding canonical Unicode Egyptian hieroglyph string, including Egyptian Hieroglyph Format Controls (EHFC)

The project must work in **vanilla HTML and JavaScript**. It must use the browser's native Custom Elements / Web Components APIs. **Do not use React, ReactDOM, MUI, Vue, Svelte, Lit, or another component framework.**

A major design goal is that the HTML source remains meaningful and readable:

```html
<p>
  The inscription contains
  <hieroglyph-tag>A1:O1</hieroglyph-tag>.
</p>
```

The MdC should remain in the element's light DOM as the source representation. The generated visual representation and UI controls should live in the element's Shadow DOM.

This is a new project, separate from the existing Inpu React application.

---

## Reference implementation

Base the implementation on the existing MdC work in:

https://github.com/arsaccol/inpu

You may clone that repository into a temporary/reference directory in order to inspect and reuse the relevant implementation. Do **not** make `inpu` itself a runtime dependency.

The most relevant files are currently:

```text
src/mdc/convertMdcToUnicode.ts
src/mdc/hierojaxAdapter.ts
src/mdc/MdcPreview.tsx
src/mdc/convertMdcToUnicode.test.ts
src/mdc/MdcPreview.test.tsx
docs/mdc.md
docs/mdc-integration-plan.md
THIRD_PARTY.md
scripts/vendor-hierojax.mjs
```

Inspect those files and any small directly related non-vendored files you need.

### Important: do not waste time inspecting vendored HieroJax internals

The Inpu repository currently has a large vendored HieroJax tree under:

```text
src/mdc/vendor/hierojax/
```

**Do not recursively inspect, summarize, or reason through that vendored runtime. Do not open the giant generated/assembled `runtime.js` unless a concrete implementation failure makes it unavoidable.**

Treat it as an upstream implementation dependency.

It is fine to copy the vendored artifacts as opaque files, and it is fine to inspect the small vendoring script and third-party notices that explain how they were produced.

The existing Inpu implementation has already established the useful boundary:

```text
MdC
  ↓
convertMdcToUnicode()
  ↓
canonical Unicode + EHFC
  ↓
HieroJax Unicode renderer
  ↓
SVG
```

Preserve that separation.

---


## Inpu scope: MdC mode only

This project should reuse **only the Manuel de Codage (MdC) functionality from Inpu**.

Do not port, depend on, or reproduce any of Inpu's other input modes or application features.

Specifically, ignore:

- phonographic/transliteration input;
- Gardiner-code candidate lookup outside what the MdC parser itself needs;
- description/keyword search;
- the hieroglyph SQL database and `inpu-db`;
- candidate selection logic;
- IME keyboard shortcuts/mode switching;
- review/database pages;
- React/MUI application state;
- routing;
- any non-MdC UI.

The relevant Inpu functionality is narrowly:

```text
MdC source
  ↓
convertMdcToUnicode()
  ↓
canonical Unicode/EHFC
  ↓
HieroJax rendering
```

plus the associated validation, warnings, font loading, and rendering behavior.

If a file or subsystem in Inpu exists only to support another input mode, do not copy or inspect it unless a direct MdC dependency makes that necessary.

## Existing behavior worth preserving

The current Inpu implementation already provides a useful `convertMdcToUnicode(source)` function. Reuse/refactor that implementation rather than rewriting the MdC conversion algorithm from scratch.

It currently:

- uses HieroJax's MdC parser/conversion machinery;
- returns canonical Unicode plus warnings;
- rejects unknown signs instead of silently accepting HieroJax placeholders;
- rejects replacement characters and private-use output;
- validates that the resulting Unicode can be parsed by the Unicode renderer;
- handles multiple lines;
- warns about known lossy MdC constructs;
- does not require a DOM, font, or renderer to perform the conversion.

Expected examples include:

```text
A1:O1
→ U+13000 U+13430 U+13250

W24*Z7
→ U+133CC U+13431 U+133F2

A1*(W24:Z7)
→ U+13000 U+13431 U+13437 U+133CC U+13430 U+133F2 U+13438

anx
→ U+132F9
```

The current Inpu renderer uses HieroJax to parse the Unicode/EHFC representation and print SVG. Preserve that basic approach.

Do not copy the React component architecture. `MdcPreview.tsx` is useful only as a behavioral reference for font loading, rendering lifecycle, and Unicode copying.

---

# Project structure

Create a clean standalone project. A reasonable structure is:

```text
hieroglyph-tags/
├── src/
│   ├── index.ts
│   ├── core.ts
│   ├── element.ts
│   ├── mdc/
│   │   └── convertMdcToUnicode.ts
│   └── hierojax/
│       ├── upstream.ts
│       └── renderer.ts
├── vendor/
│   └── hierojax/
├── scripts/
│   └── vendor-hierojax.mjs
├── demo/
│   └── index.html
├── test/
│   └── ...
├── README.md
├── THIRD_PARTY.md
├── LICENSE
├── package.json
├── tsconfig.json
└── ...
```

You may improve the exact layout if there is a good reason, but keep the responsibilities separated.

If the current working directory is clearly an empty/new project directory, initialize the project there. If it already contains an unrelated project, create a `hieroglyph-tags/` child directory rather than modifying unrelated files.

Do not push to GitHub or publish to npm. Implement and verify locally.

---


# Git repository initialization

This project should be initialized as its own Git repository and connected to:

```text
git@github.com:arsaccol/hieroglyph-tags.git
```

If the working directory is a new/empty project directory, initialize Git there. After creating the initial project files and making the first commit, configure and push the repository using:

```sh
git remote add origin git@github.com:arsaccol/hieroglyph-tags.git
git branch -M main
git push -u origin main
```

A typical complete sequence is:

```sh
git init
git add .
git commit -m "Initial hieroglyph-tags implementation"
git remote add origin git@github.com:arsaccol/hieroglyph-tags.git
git branch -M main
git push -u origin main
```

If Git is already initialized or the `origin` remote already exists, do not blindly recreate it; inspect the current repository state and configure it to use the repository above.

Do not create a different GitHub repository or remote name.

# HieroJax dependency strategy

## Initial version: vendor HieroJax

For the first implementation, vendor the same HieroJax revision/assets used by the current Inpu implementation.

At the time this brief was written, Inpu documents the HieroJax revision as:

```text
da318801e00b10b4b5c5ec8d9cc6f8fddcc9eb5a
```

However, when implementing, first inspect the current `arsaccol/inpu` default branch and use the revision documented there if it has changed.

Reuse/adapt Inpu's `scripts/vendor-hierojax.mjs` and third-party notices. Preserve all required GPL and font license notices.

Do not introduce a Git submodule for HieroJax in this project.

## Critical architectural requirement: make vendoring replaceable

A separately packaged HieroJax npm dependency is planned later. The rest of `hieroglyph-tags` must not know or care whether HieroJax is vendored or installed from npm.

Create a narrow internal boundary, for example:

```text
src/hierojax/upstream.ts
```

Only this boundary should import directly from:

```text
vendor/hierojax/...
```

The converter and renderer should import the HieroJax API through this internal module.

The desired future migration should be conceptually close to changing:

```ts
export {
  syntax,
  mdcsyntax,
  MdcFragment,
  MdcSign,
  mdcNames,
  mdcNamesUniKemet,
  Shapes,
} from '../../vendor/hierojax/runtime.js'
```

into something like:

```ts
export {
  syntax,
  mdcsyntax,
  MdcFragment,
  MdcSign,
  mdcNames,
  mdcNamesUniKemet,
  Shapes,
} from '@arsaccol/hierojax'
```

without redesigning the rest of the package.

If TypeScript needs types for the untyped upstream runtime, write narrow local declarations for only the HieroJax surface that this package consumes. Do not attempt to type the entire upstream project.

---

# Licensing

HieroJax is GPL-3.0, and the current Inpu project is GPL-3.0-only.

For this initial implementation, license `hieroglyph-tags` as:

```text
GPL-3.0-only
```

Preserve upstream authorship. Do not imply that the HieroJax code was authored by this project.

Create/adapt `THIRD_PARTY.md` to clearly state at least:

- HieroJax project and author;
- upstream repository URL;
- exact pinned revision;
- GPL-3.0 licensing;
- what this project changes or assembles;
- NewGardiner font authorship and SIL Open Font License 1.1;
- where the corresponding license texts are located.

Ensure the files shipped by `npm pack` contain the necessary notices, licenses, source/build information, and runtime assets. Do not strip upstream copyright/license headers during bundling.

---

# Public API

The primary public API is HTML:

```html
<hieroglyph-tag>A1:O1</hieroglyph-tag>
```

The package name is:

```text
hieroglyph-tags
```

The actual HTML custom element/tag name is:

```text
hieroglyph-tag
```

Use the singular `<hieroglyph-tag>` consistently throughout the implementation, documentation, demo, and tests.

Do not use `<hieroglyph>` because autonomous custom element names must contain a hyphen.

## Root browser entry point

The easiest browser import should register the custom element:

```js
import 'hieroglyph-tags'
```

after which this works:

```html
<hieroglyph-tag>A1:O1</hieroglyph-tag>
```

For direct browser/CDN use, the published build should be usable through a normal module script:

```html
<script type="module" src=".../hieroglyph-tags/.../index.js"></script>
```

The consumer must not need React, a bundler, JSX, or framework-specific setup.

## Lower-level API

Also expose the pure conversion API through a side-effect-free entry point, e.g.:

```js
import { convertMdcToUnicode } from 'hieroglyph-tags/core'
```

`core` should not register a custom element or require the browser DOM merely to convert MdC.

It is fine to expose a small explicit registration API as well, for example:

```ts
defineEgyptianHieroglyph()
```

Avoid creating a large speculative API surface.

---

# `<hieroglyph-tag>` behavior

## Source of truth

The MdC inside the element is the source of truth:

```html
<hieroglyph-tag>A1:O1</hieroglyph-tag>
```

Read it from the element's light-DOM text content.

Trim meaningless outer whitespace so this is convenient:

```html
<hieroglyph-tag>
  A1:O1
</hieroglyph-tag>
```

Do not overwrite the light DOM with generated SVG.

The original MdC must remain inspectable in the HTML/DOM after rendering.

Use a Shadow Root for generated output and controls.

Conceptually:

```text
<hieroglyph-tag>
  A1:O1                  ← light DOM, remains the source

  #shadow-root
    rendered SVG         ← visual output
    Copy MdC
    Copy Unicode
</hieroglyph-tag>
```

Do not expose or render a `<slot>` for the MdC source, because the source should not appear alongside the rendered glyphs.

## Rendering

On connection:

1. read the MdC source;
2. call `convertMdcToUnicode`;
3. load the bundled NewGardiner font;
4. render the resulting Unicode through HieroJax as SVG;
5. retain both the source MdC and derived Unicode for copy actions.

Use the existing Inpu `hierojaxAdapter.ts` as a starting point, but remove its Vite-application-specific assumptions where necessary.

The component should inherit surrounding text color. It should behave reasonably inline with prose. Prefer CSS such as:

```css
:host {
  display: inline-block;
  color: inherit;
  vertical-align: middle;
}
```

Use the component's effective/inherited font size as the basis for HieroJax rendering instead of blindly hardcoding a visual size if practical.

The first version may use the same left-to-right rendering convention as Inpu.

## Dynamic source changes

Support programmatic changes to the element's text content.

For example, this should eventually rerender:

```js
const h = document.querySelector('hieroglyph-tag')
h.textContent = 'W24*Z7'
```

A `MutationObserver` on the light DOM is a reasonable implementation.

Make asynchronous font/render work race-safe so rapid source changes do not render stale output.

Do not observe mutations inside the Shadow DOM as source changes.

## Conversion/render errors

Do not let one invalid tag break the rest of the page.

For invalid MdC:

- preserve the light-DOM source;
- render a small understandable error/fallback in the Shadow DOM;
- expose the error accessibly (for example with appropriate text/role/title);
- do not fabricate Unicode.

A static display component does not need to reproduce Inpu's editor-specific "last valid composition" behavior.

---

# Copy controls

The component must have two real `<button>` elements:

```text
Copy MdC
Copy Unicode
```

The controls should appear when the component is hovered.

They must also be reachable/visible for keyboard users, e.g. reveal them on `:focus-within` as well as `:hover`.

Do not make hover the only way to discover or operate them.

The controls should be visually unobtrusive and should not permanently consume large amounts of layout space.

## Copy MdC

Copy the component's source MdC after the same outer-whitespace normalization used for parsing.

Example:

```text
A1:O1
```

## Copy Unicode

Copy the exact canonical Unicode string returned by `convertMdcToUnicode`, including Egyptian Hieroglyph Format Controls.

Do not copy the SVG text, path data, HTML, or a visually approximated representation.

Use the Clipboard API where available. Handle clipboard failure without crashing the component.

A brief "Copied" state/accessible status is welcome but keep it simple.

---

# Styling and encapsulation

The custom element should not require the page author to add a framework stylesheet.

Prefer Shadow DOM styles for the component UI.

HieroJax currently has CSS and a NewGardiner font asset. Package those so a consumer does not have to understand the internal HieroJax asset layout.

Be careful with the font:

- it is several megabytes;
- do not accidentally base64-inline it into every JavaScript bundle unless there is a compelling reason;
- prefer emitting/copying it as a real runtime asset;
- ensure its URL resolves correctly when the package is loaded from `node_modules`, a bundled application, and a CDN-style direct module URL.

Do not leak Vite-specific imports such as `?url` or `?raw` into the final published JavaScript in a way that requires the consuming application to use Vite.

Choose build tooling that produces a normal standards-based ES module plus any required assets.

---

# Build/package requirements

Use TypeScript.

The package must be an actual library package, not a React/Vite application masquerading as one.

A reasonable `package.json` direction is:

```json
{
  "name": "hieroglyph-tags",
  "version": "0.1.0",
  "type": "module",
  "license": "GPL-3.0-only"
}
```

Add proper `exports`, `types`, and `files` fields based on the final build.

Do not mark the package `private`.

Do not publish it.

The package should have at least:

```text
npm run dev
npm run build
npm test
npm run lint
```

A Vite dev server is perfectly acceptable for the standalone vanilla demo even if another tool is more appropriate for the library build.

Avoid unnecessary production dependencies.

There must be **no React/ReactDOM/MUI dependency or peer dependency**.

---

# Vanilla demo

Create a **real, directly usable demo page** that intentionally proves the package does not depend on React.

The demo must be plain HTML/CSS/JavaScript and must be something the developer can actually launch and open in a browser as part of the project.

At minimum:

- `npm run dev` must start a local server and print or expose a URL where the demo can be opened;
- the demo page must live in the repository (for example `demo/index.html`);
- it must use the actual public library/custom-element implementation, not a demo-only copy;
- after a production build, there should also be a straightforward way to serve/open the built demo for manual verification.

Do not make the demo exist only as README snippets, tests, Storybook stories, or framework tooling.

It should contain several examples, including at least:

```html
<hieroglyph-tag>A1:O1</hieroglyph-tag>

<hieroglyph-tag>W24*Z7</hieroglyph-tag>

<hieroglyph-tag>A1*(W24:Z7)</hieroglyph-tag>

<hieroglyph-tag>anx</hieroglyph-tag>
```

Also demonstrate one tag embedded inline in an ordinary paragraph.

Demonstrate both copy controls.

Include at least one invalid example or a small manual way to test invalid input if that helps verify error handling.

The demo itself should consume the same public custom element implementation that users will receive. Do not create a separate demo-only renderer.

---

# Testing

Port/adapt the useful converter tests from Inpu.

At minimum test:

- `A1:O1` exact Unicode code-point sequence;
- `W24*Z7` exact sequence;
- nested grouping;
- `anx`;
- empty input;
- unknown sign rejection;
- private-use/replacement output rejection where applicable;
- known warning behavior where practical.

Test the custom element behavior in a DOM-capable test environment:

- registration of `hieroglyph-tag`;
- MdC is read from light DOM;
- light-DOM MdC remains present after rendering;
- generated output is placed in Shadow DOM;
- Copy MdC copies the source;
- Copy Unicode copies exact converter output;
- invalid input is contained to that component;
- source mutation triggers a new conversion/render;
- stale async render work does not win after a newer source update.

You may mock the actual HieroJax SVG renderer/font loading in unit tests. jsdom unit tests are not evidence that real SVG/font layout works.

Add a real-browser smoke test if it is reasonably lightweight (for example Playwright), especially for:

- custom element upgrade;
- Shadow DOM rendering;
- font loading;
- hover/focus copy controls;
- clipboard behavior if the environment permits;
- dynamic source mutation.

If browser automation creates disproportionate complexity, document the remaining manual verification steps clearly instead of pretending jsdom proved them.

---

# Package/distribution verification

Before considering the task complete:

1. run tests;
2. run lint/type checks;
3. run the production library build;
4. run the vanilla demo;
5. run `npm pack --dry-run` or create a local tarball and inspect what would actually ship;
6. verify the package includes the required font/runtime/license assets;
7. verify it does not include the entire cloned Inpu reference repository;
8. verify React is absent from production and peer dependencies;
9. verify a fresh tiny vanilla HTML consumer can load the built package and render `<hieroglyph-tag>`.

If feasible, test the packed tarball from a temporary consumer project rather than testing only source imports. This is important: the package should work because its distribution is correct, not merely because the repository dev server can resolve source files.

---

# README

Write a concise useful README aimed at web developers.

Lead with the simple value proposition, not internal architecture.

For example:

> Write Manuel de Codage directly in HTML and render it as properly composed Egyptian hieroglyphs.

Show vanilla HTML usage prominently:

```html
<script type="module" src="..."></script>

<p>
  The inscription reads
  <hieroglyph-tag>A1:O1</hieroglyph-tag>.
</p>
```

Then show npm usage:

```sh
npm install hieroglyph-tags
```

```js
import 'hieroglyph-tags'
```

Document:

- `<hieroglyph-tag>`;
- Copy MdC;
- Copy Unicode;
- the lower-level `convertMdcToUnicode` API;
- that rendering is powered by HieroJax;
- the MdC compatibility boundary;
- GPL licensing / third-party attribution;
- that the package currently vendors a pinned HieroJax build and that this is intentionally isolated so it can become an npm dependency later.

Do not market the package as an independent reimplementation of HieroJax. It is an author-friendly Web Component/API built on top of HieroJax.

---

# Scope boundaries

Do **not** turn this project into:

- a full Egyptological text editor;
- a Tiptap/ProseMirror editor;
- a PDF generator;
- a LaTeX package;
- a React wrapper;
- a replacement for all of Inpu;
- an independent rewrite of HieroJax;
- an MdC standardization project.

Do not copy Inpu's SQL database, IME candidate system, transliteration search, MUI UI, router, review page, or React state management.

The focused first release is:

```text
MdC written directly in HTML
        ↓
native <hieroglyph-tag> custom element
        ↓
MdC → canonical Unicode/EHFC
        ↓
HieroJax SVG rendering
        ↓
nice hieroglyphs in ordinary web pages

plus:
[Copy MdC] [Copy Unicode]
```

That is enough.

---

# Implementation approach

Work autonomously. Do not stop merely to propose a plan.

A good sequence is:

1. inspect the relevant non-vendored files in `arsaccol/inpu`;
2. initialize the standalone `hieroglyph-tags` package;
3. establish the narrow HieroJax upstream boundary and vendor the current pinned upstream artifacts;
4. port/refactor `convertMdcToUnicode`;
5. port/refactor font loading and Unicode SVG rendering without React;
6. implement the Web Component and Shadow DOM UI;
7. implement copy behavior;
8. implement dynamic source updates and error handling;
9. build the vanilla demo;
10. add tests;
11. build/package the library;
12. test the packed package from a fresh vanilla consumer if feasible;
13. update README, licensing, and third-party notices;
14. report what was implemented, verification performed, and any remaining browser-specific caveats.

Prefer a small coherent implementation over speculative abstractions.

Where the existing Inpu implementation already solved a subtle problem correctly, preserve that behavior unless there is a clear reason to change it.

Where this brief leaves a low-level implementation choice open, choose the simplest standards-based solution that keeps the public package framework-independent and keeps HieroJax replaceable as a dependency later.
