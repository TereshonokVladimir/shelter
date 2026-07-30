import { classicPack } from './pack-classic';
import { memePack } from './pack-meme';
import { hardcorePack } from './pack-hardcore';
import { DEFAULT_ACTIONS } from './actions';
import type { PackSeed } from './types';
export type { PackSeed, Category, CharItem, NamedDesc, ActionSeed, ActionEffectType } from './types';
export { classicPack, memePack, hardcorePack, DEFAULT_ACTIONS };
export declare const builtinPacks: PackSeed[];
