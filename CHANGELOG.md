# @rgrmdesign/rgrm-ds-tokens

## 0.12.0

### Minor Changes

- a995ce2: Move `radius` and `size` tokens from core to the scale collection. Button `border-radius` and `min-block-size` now reference fluid scale tokens (`--rgrm-scale-radius-*`, `--rgrm-scale-size-*`).

## 0.11.0

### Minor Changes

- 1973f77: **BREAKING CHANGE:** Align CSS custom property names with the refactored Figma collections.
  - `--rgrm-default-*` → `--rgrm-core-*`
  - `--rgrm-typography-*` → `--rgrm-core-*` (typography is merged into core)
  - `--rgrm-viewport-*` → `--rgrm-scale-*`

  Removed core variables (for example `nav-height`, `focus-*`, and `button-size-*`) are no longer emitted. Update any references to the old variable names before upgrading.

## 0.10.0

### Minor Changes

- 81076e3: Add selection tokens to root

## 0.9.0

### Minor Changes

- 0abe41e: Add root component tokens for document-level styles (`--rgrm-root-background-color`, `--rgrm-root-color`, typography, and related properties) in `components.css`.

## 0.8.0

### Minor Changes

- cf83a57: Change font to open source Geist

## 0.7.0

### Minor Changes

- 20f8bcd: Split CSS output into three layers so themed components resolve correctly in nested `[data-theme]` sections.

## 0.6.1

### Patch Changes

- 26ffc10: Update button tokens with adjusted paddings

## 0.6.0

### Minor Changes

- 1ee39f5: Add button tokens and remove unused tokens

## 0.5.0

### Minor Changes

- b8276f5: Make Heading tokens available in output

## 0.4.0

### Minor Changes

- a886404: Add Heading tokens

## 0.3.0

### Minor Changes

- b4eb07a: Update colors en remove \_ variables

## 0.2.0

### Minor Changes

- 1647f16: Prefix every CSS custom property with `rgrm-<collection>` so variable names are namespaced and collision-free (e.g. `--rgrm-paragraph-main-font-family`, `--rgrm-typography-font-primary-family`, `--rgrm-viewport-font-size-main`, `--rgrm-theme-background`).

  This is a breaking change: all generated variable names have changed. Update consumers to the new `--rgrm-*` names.

  Also realigns the build with the renamed Figma `paragraph` collection (was `paragraph-style`) and emits the merged fluid `clamp()` tokens under their original `viewport` collection name.

## 0.1.1

### Patch Changes

- 5f98aee: Test Changelog Releases
