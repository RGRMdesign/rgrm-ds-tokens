# @rgrmdesign/rgrm-ds-tokens

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
