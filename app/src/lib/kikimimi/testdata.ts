// ききみみ's committed clips and word timings, typed: what the tests that compile the levels read (levels, lesson,
// units). Test-only.
import type { Clip, Words } from './clips.ts';
import clipsJson from './clips.json';
import wordsJson from './words.json';

export const CLIPS: Readonly<Record<string, Clip>> = clipsJson;
export const WORDS = wordsJson as unknown as Readonly<Record<string, Words>>;
