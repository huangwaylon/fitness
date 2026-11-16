// English Study's clips, in the order they're offered (easier first): today's clip is the first not finished yet.
// One line a clip: its file in this folder, its lesson in docs/english.md's shape (lib/english/types.ts Clip).
// clips.test checks every one (ids, segments, choices, the notes).
import type { Clip } from '../types.ts';
import { waitress } from './waitress.ts';

export const CLIPS: readonly Clip[] = [
  waitress
];
