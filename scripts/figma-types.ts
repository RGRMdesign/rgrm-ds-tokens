/**
 * Minimal types describing the relevant parts of Figma's W3C DTCG variable
 * export, plus the normalised token tree our scripts produce.
 */

export interface FigmaColorValue {
  colorSpace: string;
  components: number[];
  alpha: number;
  hex: string;
}

export type FigmaTokenValue = number | string | FigmaColorValue;

export interface FigmaAliasData {
  targetVariableId?: string;
  targetVariableName?: string;
  targetVariableSetId?: string;
  targetVariableSetName?: string;
}

export interface FigmaExtensions {
  'com.figma.variableId'?: string;
  'com.figma.scopes'?: string[];
  'com.figma.type'?: string;
  'com.figma.aliasData'?: FigmaAliasData;
  'com.figma.modeName'?: string;
}

export interface FigmaToken {
  $type: string;
  $value: FigmaTokenValue;
  $extensions?: FigmaExtensions;
}

/** A group node may hold nested groups, tokens, or collection metadata. */
export interface FigmaTree {
  [key: string]: FigmaNode | FigmaExtensions | undefined;
}

export type FigmaNode = FigmaToken | FigmaTree;

/** Normalised output: tokens with only `$type` / `$value`, no `$extensions`. */
export interface CleanToken {
  $type: string;
  $value: FigmaTokenValue;
}

export interface CleanTree {
  [key: string]: CleanToken | CleanTree;
}

export function isFigmaToken(node: unknown): node is FigmaToken {
  return (
    typeof node === 'object' &&
    node !== null &&
    Object.prototype.hasOwnProperty.call(node, '$value')
  );
}

export function isFigmaColorValue(value: unknown): value is FigmaColorValue {
  return typeof value === 'object' && value !== null && 'components' in value;
}
