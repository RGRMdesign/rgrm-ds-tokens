---
"@rgrmdesign/rgrm-ds-tokens": minor
---

Prefix every CSS custom property with `rgrm-<collection>` so variable names are namespaced and collision-free (e.g. `--rgrm-paragraph-main-font-family`, `--rgrm-typography-font-primary-family`, `--rgrm-viewport-font-size-main`, `--rgrm-theme-background`).

This is a breaking change: all generated variable names have changed. Update consumers to the new `--rgrm-*` names.

Also realigns the build with the renamed Figma `paragraph` collection (was `paragraph-style`) and emits the merged fluid `clamp()` tokens under their original `viewport` collection name.
