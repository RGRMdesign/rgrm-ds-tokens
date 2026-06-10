---
"@rgrmdesign/rgrm-ds-tokens": minor
---

**BREAKING CHANGE:** Align CSS custom property names with the refactored Figma collections.

- `--rgrm-default-*` → `--rgrm-core-*`
- `--rgrm-typography-*` → `--rgrm-core-*` (typography is merged into core)
- `--rgrm-viewport-*` → `--rgrm-scale-*`

Removed core variables (for example `nav-height`, `focus-*`, and `button-size-*`) are no longer emitted. Update any references to the old variable names before upgrading.
