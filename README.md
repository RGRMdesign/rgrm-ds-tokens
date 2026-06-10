# @rgrmdesign/rgrm-ds-tokens

Design tokens as CSS custom properties, generated from Figma variables with
[Style Dictionary](https://styledictionary.com).

The Figma export (W3C DTCG format) lives in [`figma/`](figma/) and is turned into
publishable CSS in `dist/` by a build step.

## Primary consumer

These tokens are the **source of truth for visual design** in the
[RGRM Design System](https://github.com/RGRMdesign/rgrm-ds) (`@rgrmdesign/rgrm-ds-*`).
That monorepo ships component CSS, React components, and Web Components that
reference component tokens from this package (e.g. `var(--rgrm-heading-h1-font-size)`).
The design system declares `@rgrmdesign/rgrm-ds-tokens` as a **peer dependency**,
so consuming apps load the tokens once and share them across all `@rgrmdesign/rgrm-ds-*`
packages.

| Goal | Where to start |
| --- | --- |
| Use RGRM components (Button, Heading, …) | [rgrm-ds](https://github.com/RGRMdesign/rgrm-ds) — install `@rgrmdesign/rgrm-ds-css`, `-react`, or `-elements`; tokens are pulled in via the peer dependency |
| Browse components and themes | [Storybook](https://rgrmdesign.github.io/rgrm-ds/) (deployed from `rgrm-ds`) |
| Custom UI with only the token variables | This package — install and import the CSS below |

Token changes in this repository are released independently on npm; bump the
`@rgrmdesign/rgrm-ds-tokens` version in your app (or in `rgrm-ds`) to pick up
new variables or theme updates.

## Installation

```bash
npm install @rgrmdesign/rgrm-ds-tokens
```

## Usage

Import the complete bundle (root tokens + all themes in a single file):

```css
@import "@rgrmdesign/rgrm-ds-tokens/tokens.css";
```

Or import selectively (load `components.css` after root and any theme files):

```css
@import "@rgrmdesign/rgrm-ds-tokens/root.css";        /* :root primitives + base theme */
@import "@rgrmdesign/rgrm-ds-tokens/dark.css";        /* [data-theme="dark"] */
@import "@rgrmdesign/rgrm-ds-tokens/brand.css";      /* [data-theme="brand"] */
@import "@rgrmdesign/rgrm-ds-tokens/components.css";  /* component tokens */
```

Output is split into three layers:

1. **`root.css`** (`:root`) — primitives (`--rgrm-core-*`, `--rgrm-scale-*`) and base
   theme (`--rgrm-theme-*`).
2. **`theme-*.css`** (`[data-theme="…"]`) — theme overrides only.
3. **`components.css`** (`:where(:root, [data-theme])`) — component tokens
   (`--rgrm-paragraph-*`, `--rgrm-heading-*`, `--rgrm-button-*`, …). These are
   what component CSS typically consumes; they alias down to theme and scale tokens
   and are re-declared on themed sections so nested themes resolve correctly.

In practice, component styles read **component tokens** (`--rgrm-<component>-*`),
not primitives or theme tokens directly. Names follow
`--rgrm-<component>-<variant>-<property>`; interaction states use suffixes such as
`-hover`, `-active` and `-focus-visible`:

```css
.rgrm-button--primary {
  border-radius: var(--rgrm-button-primary-border-radius);
  padding-block: var(--rgrm-button-primary-padding-block-start)
    var(--rgrm-button-primary-padding-block-end);
  background: var(--rgrm-button-primary-background-color);
  color: var(--rgrm-button-primary-color);
}

.rgrm-button--primary:hover {
  background: var(--rgrm-button-primary-background-color-hover);
  color: var(--rgrm-button-primary-color-hover);
}
```

For custom UI without RGRM components you can still use lower layers directly
(`--rgrm-theme-*`, `--rgrm-scale-*`, `--rgrm-core-*`).

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

The `scale` collection in Figma has a `small` and a `large` mode (the min/max
ends of fluid typography and spacing). These are merged into a single set of
`clamp()` values that scale between the viewport breakpoints
(`--rgrm-core-site-viewport-min` … `--rgrm-core-site-viewport-max`). For example:

```css
--rgrm-scale-font-size-main: clamp(1rem, 0.9643rem + 0.1786vw, 1.125rem);
```

## Development

This project uses **pnpm** (via Corepack) and **TypeScript** (run with
[`tsx`](https://tsx.is), no separate compile step). Requires Node 22.13+ (see
`.nvmrc`); `pnpm@11` won't run on older Node versions.

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
2. **`scripts/generate-fluid.ts`** – merges the scale `small`/`large` modes into
   fluid `clamp()` tokens.
3. **`build.ts`** – runs Style Dictionary in four passes (`:root` primitives +
   base theme, theme overrides, `:where(:root, [data-theme])` components) and
   bundles the output.

Intermediate files go to `build/` (git-ignored); the publishable output to
`dist/`.

### Conventions

- Numeric dimensions are converted to `rem` (16px base); `line-height`,
  `font-weight`, and ratios stay unitless, `letter-spacing` uses `em`.
- Colors become hex (opaque) or `rgba()` (with transparency).
- Figma helpers prefixed with `_` are private: they remain usable for reference
  resolution but are not emitted in the output (references to them are inlined).

## Publishing

Releases are versioned with [Changesets](https://github.com/changesets/changesets)
and published to npm automatically by GitHub Actions
(`.github/workflows/release.yml`).

Workflow for a change:

```bash
pnpm changeset          # describe the change + pick a semver bump
git commit -am "…"      # commit code + the new .changeset/*.md
git push                # push to main (or open a PR)
```

On push to `main` the workflow opens a **"Version Packages"** PR (version bump +
changelog). Merging that PR triggers the actual `pnpm release`
(`changeset publish`) to npm.

`prepublishOnly` automatically runs `clean` + `typecheck` + `build`, so only a
fresh `dist/` is published (see the `files` field in `package.json`).

Publishing uses npm [Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
via OIDC (`id-token: write`), so no `NPM_TOKEN` secret is needed and packages are
published with provenance.

## License

[MIT](LICENSE)
