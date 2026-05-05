export type TextValue = string | TextTree;

export interface TextTree {
  [key: string]: TextValue;
}

export type TranslationTree = TextTree;

export type TextParams = Record<string, string | number>;
