import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isFigmaToken,
  type CleanTree,
  type FigmaNode,
  type FigmaTree,
} from './figma-types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIGMA_DIR = join(ROOT, 'figma');
const OUT_DIR = join(ROOT, 'build', 'tokens');

/**
 * Figma's DTCG export keeps intra-collection references as `{group.token}` in
 * `$value`, but flattens cross-collection references to a literal value while
 * storing the original link in `$extensions["com.figma.aliasData"]`.
 *
 * This converts that aliasData back into a real DTCG reference so the whole
 * token graph stays connected across collections, and strips the Figma-specific
 * `$extensions` noise that Style Dictionary does not need.
 */
function aliasNameToRef(name: string): string {
  // "swatch/light-200" -> "{swatch.light-200}"
  return `{${name.replace(/\//g, '.')}}`;
}

export function cleanTokens(node: FigmaNode): CleanTree[string] {
  if (isFigmaToken(node)) {
    const alias = node.$extensions?.['com.figma.aliasData'];
    return {
      $type: node.$type,
      $value: alias?.targetVariableName
        ? aliasNameToRef(alias.targetVariableName)
        : node.$value,
    };
  }

  const out: CleanTree = {};
  for (const [key, value] of Object.entries(node as FigmaTree)) {
    // Drop Figma collection metadata (e.g. modeName).
    if (key === '$extensions' || value === undefined) continue;
    out[key] = cleanTokens(value as FigmaNode);
  }
  return out;
}

function readJson(path: string): FigmaTree {
  return JSON.parse(readFileSync(path, 'utf8')) as FigmaTree;
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/**
 * Normalises every collection except `scale` (the scale modes are merged into
 * fluid clamp() tokens by generate-fluid.ts).
 */
export function restoreAliases(): string[] {
  const jobs = [
    { src: join(FIGMA_DIR, 'core', 'tokens.json'), out: join(OUT_DIR, 'core.json') },
    { src: join(FIGMA_DIR, 'paragraph', 'tokens.json'), out: join(OUT_DIR, 'paragraph.json') },
    { src: join(FIGMA_DIR, 'heading', 'tokens.json'), out: join(OUT_DIR, 'heading.json') },
    { src: join(FIGMA_DIR, 'button', 'tokens.json'), out: join(OUT_DIR, 'button.json') },
    { src: join(FIGMA_DIR, 'link', 'tokens.json'), out: join(OUT_DIR, 'link.json') },
    { src: join(FIGMA_DIR, 'badge', 'tokens.json'), out: join(OUT_DIR, 'badge.json') },
    { src: join(FIGMA_DIR, 'root', 'tokens.json'), out: join(OUT_DIR, 'root.json') },
    { src: join(FIGMA_DIR, 'theme', 'base.tokens.json'), out: join(OUT_DIR, 'theme', 'base.json') },
    { src: join(FIGMA_DIR, 'theme', 'dark.tokens.json'), out: join(OUT_DIR, 'theme', 'dark.json') },
    { src: join(FIGMA_DIR, 'theme', 'brand.tokens.json'), out: join(OUT_DIR, 'theme', 'brand.json') },
  ];

  for (const { src, out } of jobs) {
    const cleaned = cleanTokens(readJson(src));
    // Root and badge tokens are flat in Figma; nest them so names like
    // `letter-spacing` / `line-height` do not collide with referenced groups.
    const data = out.endsWith('/root.json')
      ? { core: cleaned }
      : out.endsWith('/badge.json')
        ? { main: cleaned }
        : cleaned;
    writeJson(out, data);
  }

  return jobs.map((j) => j.out);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const written = restoreAliases();
  console.log(`restore-aliases: wrote ${written.length} files to build/tokens/`);
}
