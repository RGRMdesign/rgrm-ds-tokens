import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REM_BASE, round, pxToRem } from './units.ts';
import { isFigmaToken, type FigmaTree } from './figma-types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIGMA_DIR = join(ROOT, 'figma');
const OUT_FILE = join(ROOT, 'build', 'tokens', 'scale.json');

interface FluidToken {
  $type: string;
  $value: string;
}
interface FluidTree {
  [key: string]: FluidToken | FluidTree;
}

/**
 * The `scale` collection has two modes (small/large) that represent the min/max
 * ends of fluid typography and spacing. We collapse them into a single set of
 * `clamp()` tokens that interpolate between the small and large viewport widths
 * (viewport-min / viewport-max from the core collection).
 */
function readJson(path: string): FigmaTree {
  return JSON.parse(readFileSync(path, 'utf8')) as FigmaTree;
}

/**
 * Build the fluid CSS value. Math is done in px for clarity, then the constant
 * parts are converted to rem; the slope keeps its viewport-relative `vw` unit.
 */
function fluidValue(
  smallPx: number,
  largePx: number,
  minWidthPx: number,
  maxWidthPx: number,
): string {
  if (smallPx === largePx) return pxToRem(smallPx);

  const slopePxPerPx = (largePx - smallPx) / (maxWidthPx - minWidthPx);
  const interceptPx = smallPx - slopePxPerPx * minWidthPx;

  const interceptRem = round(interceptPx / REM_BASE);
  const slopeVw = round(slopePxPerPx * 100);

  const loRem = round(Math.min(smallPx, largePx) / REM_BASE);
  const hiRem = round(Math.max(smallPx, largePx) / REM_BASE);

  const preferred =
    interceptRem === 0 ? `${slopeVw}vw` : `${interceptRem}rem + ${slopeVw}vw`;

  return `clamp(${loRem}rem, ${preferred}, ${hiRem}rem)`;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value);
}

function walk(
  smallNode: FigmaTree,
  largeNode: FigmaTree | undefined,
  minWidthPx: number,
  maxWidthPx: number,
): FluidTree {
  const out: FluidTree = {};
  for (const [key, smallChild] of Object.entries(smallNode)) {
    if (key === '$extensions' || smallChild === undefined) continue;
    const largeChild = largeNode?.[key];

    if (isFigmaToken(smallChild)) {
      const small = asNumber(smallChild.$value);
      const large = isFigmaToken(largeChild) ? asNumber(largeChild.$value) : small;
      out[key] = {
        $type: smallChild.$type,
        $value: fluidValue(small, large, minWidthPx, maxWidthPx),
      };
    } else if (typeof smallChild === 'object') {
      out[key] = walk(
        smallChild as FigmaTree,
        largeChild as FigmaTree | undefined,
        minWidthPx,
        maxWidthPx,
      );
    }
  }
  return out;
}

export function generateFluid(): string {
  const small = readJson(join(FIGMA_DIR, 'scale', 'small.tokens.json'));
  const large = readJson(join(FIGMA_DIR, 'scale', 'large.tokens.json'));
  const core = readJson(join(FIGMA_DIR, 'core', 'tokens.json'));

  // viewport-min / viewport-max are expressed in rem (20rem = 320px, 90rem = 1440px).
  const site = core.site as FigmaTree;
  const breakpointRem = (key: string): number => {
    const token = site[key];
    if (!isFigmaToken(token)) throw new Error(`Expected site.${key} to be a token`);
    return asNumber(token.$value);
  };
  const minWidthPx = breakpointRem('viewport-min') * REM_BASE;
  const maxWidthPx = breakpointRem('viewport-max') * REM_BASE;

  const fluid = walk(small, large, minWidthPx, maxWidthPx);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(fluid, null, 2)}\n`);
  return OUT_FILE;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  generateFluid();
  console.log('generate-fluid: wrote build/tokens/scale.json');
}
