# rgrm-ds-tokens

Design tokens as CSS custom properties, generated from Figma variables with
[Style Dictionary](https://styledictionary.com).

The Figma export (W3C DTCG format) lives in [`figma/`](figma/) and is turned into
publishable CSS in `dist/` by a build step.

## Installation

```bash
npm install rgrm-ds-tokens
```

## Usage

Import the complete bundle (root tokens + all themes in a single file):

```css
@import "rgrm-ds-tokens/tokens.css";
```

Or import selectively:

```css
@import "rgrm-ds-tokens/root.css";   /* :root base + base theme */
@import "rgrm-ds-tokens/dark.css";   /* [data-theme="dark"] */
@import "rgrm-ds-tokens/brand.css";  /* [data-theme="brand"] */
```

The tokens are then available as CSS custom properties:

```css
.card {
  background: var(--background);
  color: var(--text);
  padding: var(--space-5);
  border-radius: var(--radius-main);
  font-size: var(--font-size-main);
}
```

### Switching themes

The `base` theme lives on `:root`. Enable another theme via the `data-theme`
attribute (on `<html>`, `<body>`, or any container):

```html
<html data-theme="dark">
<!-- or -->
<div data-theme="brand"> ... </div>
```

Theme tokens reference the shared `swatch` palette variables from `:root`, so
`root.css` (or `tokens.css`) must always be loaded.

### Fluid typography and spacing

The `viewport` collection in Figma has a `small` and a `large` mode (the min/max
ends of fluid typography and spacing). These are merged into a single set of
`clamp()` values that scale between the viewport breakpoints
(`--site-viewport-min` … `--site-viewport-max`). For example:

```css
--font-size-main: clamp(1rem, 0.9643rem + 0.1786vw, 1.125rem);
```

## Development

This project uses **pnpm** (via Corepack) and **TypeScript** (run with
[`tsx`](https://tsx.is), no separate compile step). Requires Node 20+.

```bash
corepack enable        # one-time: activates the pnpm version from package.json
pnpm install
pnpm run build         # generate dist/
pnpm run typecheck     # tsc --noEmit
```

## (Re)generating tokens

On a new Figma export: replace the files in `figma/` and run `pnpm run build`.
The build does three things:

1. **`scripts/restore-aliases.ts`** – restores cross-collection references.
   Figma flattens those into literal values while keeping the original link in
   `com.figma.aliasData`; this converts them back into real DTCG references.
2. **`scripts/generate-fluid.ts`** – merges the viewport `small`/`large` modes
   into fluid `clamp()` tokens.
3. **`build.ts`** – runs Style Dictionary in three passes (`:root` + base,
   `[data-theme="dark"]`, `[data-theme="brand"]`) and bundles the output.

Intermediate files go to `build/` (git-ignored); the publishable output to
`dist/`.

### Conventions

- Numeric dimensions are converted to `rem` (16px base); `line-height`,
  `font-weight`, and ratios stay unitless, `letter-spacing` uses `em`.
- Colors become hex (opaque) or `rgba()` (with transparency).
- Figma helpers prefixed with `_` are private: they remain usable for reference
  resolution but are not emitted in the output (references to them are inlined).

## Publishing

```bash
pnpm publish
```

`prepublishOnly` automatically runs `clean` + `typecheck` + `build`, so only a
fresh `dist/` is published (see the `files` field in `package.json`).

## License

[MIT](LICENSE)
