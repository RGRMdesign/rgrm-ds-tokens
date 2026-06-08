import StyleDictionary from 'style-dictionary';
import { getReferences, usesReferences } from 'style-dictionary/utils';
import type { Config, TransformedToken, Dictionary, Filter } from 'style-dictionary/types';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { restoreAliases } from './scripts/restore-aliases.ts';
import { generateFluid } from './scripts/generate-fluid.ts';
import { registerFigmaTransforms } from './scripts/transforms.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));

// 1. Normalise Figma exports: restore cross-collection refs + build fluid tokens.
restoreAliases();
generateFluid();

// 2. Register our CSS transforms.
registerFigmaTransforms(StyleDictionary);

// Tokens shared across every theme (loaded in each pass so references resolve).
const GLOBAL_SOURCES = [
  'build/tokens/default.json',
  'build/tokens/typography.json',
  'build/tokens/paragraph.json',
  'build/tokens/heading.json',
  'build/tokens/button.json',
  'build/tokens/viewport.json',
];

// Private Figma helpers are prefixed with `_`: keep them resolvable, hide from output.
const isPrivate = (token: TransformedToken): boolean =>
  token.path.some((segment) => segment.startsWith('_'));
const isPublic = (token: TransformedToken): boolean => !isPrivate(token);
const isTheme = (token: TransformedToken): boolean => (token.filePath ?? '').includes('/theme/');

const COMPONENT_COLLECTIONS = ['paragraph', 'heading', 'button'] as const;

const isComponentToken = (token: TransformedToken): boolean =>
  COMPONENT_COLLECTIONS.some((name) => (token.filePath ?? '').includes(`/${name}.json`));

/** Primitives + theme on :root; component API on :where(:root, [data-theme]). */
const COMPONENT_SELECTOR = ':where(:root, [data-theme])';

/**
 * Emit `var(--ref)` only when every referenced token is public. Primitives live on
 * :root; component tokens live on :where(:root, [data-theme]). Theme overrides are
 * scoped to [data-theme="…"] and are not re-emitted there. References to private
 * (`_`) helpers are inlined as literal values instead, avoiding dangling `var()`s.
 */
function outputReferencesPublic(
  token: TransformedToken,
  options: { dictionary: Dictionary; usesDtcg?: boolean },
): boolean {
  const { dictionary, usesDtcg } = options;
  const original = token.original?.$value ?? token.original?.value;
  if (original === undefined || !usesReferences(original)) return false;
  const allTokens = dictionary.unfilteredTokens ?? dictionary.tokens;
  let refs: TransformedToken[];
  try {
    refs = getReferences(original, allTokens, {
      usesDtcg,
      unfilteredTokens: dictionary.unfilteredTokens,
    });
  } catch {
    return false;
  }
  return refs.length > 0 && refs.every((ref) => !isPrivate(ref));
}

interface Pass {
  themeFile: string;
  selector: string;
  destination: string;
  filter: Filter['filter'];
}

function makeBuild({ themeFile, selector, destination, filter }: Pass): StyleDictionary {
  const config: Config = {
    source: [...GLOBAL_SOURCES, themeFile],
    platforms: {
      css: {
        transformGroup: 'css-figma',
        buildPath: 'dist/css/',
        files: [
          {
            destination,
            format: 'css/variables',
            filter,
            options: {
              selector,
              outputReferences: outputReferencesPublic,
            },
          },
        ],
      },
    },
    // References to private (`_`) tokens are intentionally inlined (see
    // outputReferencesPublic), so silence Style Dictionary's "filtered out token
    // references" warnings; the build is verified to have no dangling var()s.
    log: { verbosity: 'default', warnings: 'disabled' },
  };
  return new StyleDictionary(config);
}

const PASSES: Pass[] = [
  {
    // Primitives (default, typography, viewport) + base theme on :root.
    themeFile: 'build/tokens/theme/base.json',
    selector: ':root',
    destination: 'root.css',
    filter: (token) => isPublic(token) && !isComponentToken(token),
  },
  {
    themeFile: 'build/tokens/theme/dark.json',
    selector: '[data-theme="dark"]',
    destination: 'theme-dark.css',
    filter: (token) => !isPrivate(token) && isTheme(token),
  },
  {
    themeFile: 'build/tokens/theme/brand.json',
    selector: '[data-theme="brand"]',
    destination: 'theme-brand.css',
    filter: (token) => !isPrivate(token) && isTheme(token),
  },
  {
    // All component tokens; re-declared on themed sections so theme-bound aliases
    // resolve in the correct theme context (see COMPONENT_SELECTOR).
    themeFile: 'build/tokens/theme/base.json',
    selector: COMPONENT_SELECTOR,
    destination: 'components.css',
    filter: (token) => isPublic(token) && isComponentToken(token),
  },
];

for (const pass of PASSES) {
  const sd = makeBuild(pass);
  await sd.buildAllPlatforms();
}

// 3. Aggregate outputs: a single self-contained bundle + an @import entry point.
const cssDir = join(ROOT, 'dist', 'css');
const files = ['root.css', 'theme-dark.css', 'theme-brand.css', 'components.css'];

const banner = '/**\n * rgrm-ds-tokens — generated from Figma. Do not edit by hand.\n */\n';

const bundle =
  banner + files.map((f) => readFileSync(join(cssDir, f), 'utf8').trim()).join('\n\n') + '\n';
mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'tokens.css'), bundle);

const index = banner + files.map((f) => `@import "./css/${f}";`).join('\n') + '\n';
writeFileSync(join(ROOT, 'dist', 'index.css'), index);

console.log('\nBuild complete: dist/tokens.css, dist/index.css, dist/css/*.css');
