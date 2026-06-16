---
"@rgrmdesign/rgrm-ds-tokens": minor
---

Add link component tokens and refresh text-link theme styling from Figma.

- Add `--rgrm-link-*` component tokens (`color`, hover/active states, underline line, thickness, offset)
- Add purple swatch primitives (`--rgrm-core-swatch-purple-300` through `-700`) and text-decoration line tokens
- Update `--rgrm-theme-text-link-*` to use the purple palette; add `text-active`; remove `text-link` border tokens
- Adjust small-scale spacing (`--rgrm-scale-space-1`, `--rgrm-scale-space-8`)
- Emit link underline metrics (`text-decoration-thickness`, `text-underline-offset`) as `em`
