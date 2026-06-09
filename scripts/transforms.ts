import type StyleDictionary from 'style-dictionary';
import type { TransformedToken } from 'style-dictionary/types';
import { round, pxToRem } from './units.ts';
import { isFigmaColorValue, type FigmaTokenValue } from './figma-types.ts';

// DTCG-aware accessors (Style Dictionary keeps the `$` prefix for DTCG tokens).
const getType = (token: TransformedToken): string | undefined => token.$type ?? token.type;
const getValue = (token: TransformedToken): FigmaTokenValue => token.$value ?? token.value;

/**
 * Figma exports colors as `{ colorSpace, components, alpha, hex }`. Output a hex
 * string for opaque colors and rgba() when there is transparency.
 */
function colorToCss(value: FigmaTokenValue): string {
  if (!isFigmaColorValue(value)) return String(value); // ref string, already a string, etc.
  const { components, alpha, hex } = value;
  if (alpha >= 1) return (hex ?? '#000000').toUpperCase();
  const [r, g, b] = components.map((c) => Math.round(c * 255));
  return `rgba(${r}, ${g}, ${b}, ${round(alpha, 3)})`;
}

/**
 * Decide the unit for a numeric token based on its path. Most numbers are px
 * dimensions converted to rem; a handful are unitless or use other units.
 */
function numberToCss(value: FigmaTokenValue, path: string[]): string {
  if (typeof value !== 'number') return String(value); // clamp() string, ref string, etc.
  const last = path[path.length - 1] ?? '';
  const has = (segment: string): boolean => path.includes(segment);

  // Unitless ratios / counts / weights.
  if (has('line-height')) return String(round(value));
  if (last === 'font-weight') return String(round(value));
  if (path[0] === 'font' && /^primary-(regular|medium|bold)$/.test(last)) return String(round(value));
  if (last.includes('trim')) return String(round(value));
  if (last === 'column-count') return String(round(value));

  // Letter spacing is relative to the font size.
  if (has('letter-spacing')) {
    const em = round(value);
    return em === 0 ? '0' : `${em}em`;
  }

  // Viewport breakpoints are authored in rem (20 -> 20rem), not px.
  if (last === 'viewport-min' || last === 'viewport-max') return `${round(value)}rem`;

  // Everything else is a px dimension -> rem.
  return pxToRem(value);
}

/** Quote multi-word string values (e.g. font families) for safe CSS usage. */
function stringToCss(value: FigmaTokenValue): string {
  if (typeof value !== 'string') return String(value);
  return /\s/.test(value) ? `"${value}"` : value;
}

/** Lower-case, hyphenate camelCase / spaces / underscores into a single kebab segment. */
function kebab(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Derive the Figma collection name from a token's source file. Every theme mode
 * (base/dark/brand) lives in the same `theme` collection, so they share a prefix
 * and override each other through the cascade.
 */
function collectionOf(filePath: string | undefined): string {
  const fp = filePath ?? '';
  if (fp.includes('/theme/')) return 'theme';
  const file = fp.split('/').pop() ?? '';
  return file.replace(/\.json$/, '') || 'tokens';
}

/** Root tokens are nested under `default` in source only; omit that segment in CSS names. */
function namePath(token: TransformedToken): string[] {
  const path = token.path;
  if (collectionOf(token.filePath) === 'root' && path[0] === 'default') return path.slice(1);
  return path;
}

export function registerFigmaTransforms(sd: typeof StyleDictionary): void {
  // Output names are `rgrm-<collection>-<token-path>`, e.g. a `main/font-family`
  // token from the `paragraph` collection becomes `--rgrm-paragraph-main-font-family`.
  sd.registerTransform({
    name: 'name/rgrm-collection',
    type: 'name',
    transform: (token) =>
      ['rgrm', collectionOf(token.filePath), ...namePath(token)].map(kebab).join('-'),
  });

  sd.registerTransform({
    name: 'color/figma-css',
    type: 'value',
    transitive: true,
    filter: (token) => getType(token) === 'color',
    transform: (token) => colorToCss(getValue(token)),
  });

  sd.registerTransform({
    name: 'size/figma-rem',
    type: 'value',
    transitive: true,
    filter: (token) => getType(token) === 'number',
    transform: (token) => numberToCss(getValue(token), token.path),
  });

  sd.registerTransform({
    name: 'string/figma-css',
    type: 'value',
    transitive: true,
    filter: (token) => getType(token) === 'string',
    transform: (token) => stringToCss(getValue(token)),
  });

  sd.registerTransformGroup({
    name: 'css-figma',
    transforms: ['name/rgrm-collection', 'color/figma-css', 'size/figma-rem', 'string/figma-css'],
  });
}
