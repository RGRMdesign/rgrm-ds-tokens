export const REM_BASE = 16;

/** Round to a sane precision and drop trailing zeros (e.g. 0.5000 -> 0.5). */
export function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Convert a px number to a rem string. 0 stays unitless. */
export function pxToRem(px: number): string {
  const rem = round(px / REM_BASE);
  return rem === 0 ? '0' : `${rem}rem`;
}
