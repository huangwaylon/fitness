// English Study's clips, in the order they're offered (easier first): today's clip is the first not finished yet.
// One line a clip: its file in this folder, its lesson in docs/english.md's shape (lib/english/types.ts Clip).
// clips.test checks every one (ids, segments, choices, the notes).
// Order: the first five lessons as they were; then the banks of 2026-11-16 (all 速い), slower first, the situation
// changing from one to the next.
import type { Clip } from '../types.ts';
import { waitress } from './waitress.ts';
import { centralperk } from './centralperk.ts';
import { furniture } from './furniture.ts';
import { laundromat } from './laundromat.ts';
import { datinglang } from './datinglang.ts';
import { annclub } from './annclub.ts';
import { bucketList } from './bucketlist.ts';
import { waffleGift } from './wafflegift.ts';
import { possum } from './possum.ts';
import { kathybook } from './kathybook.ts';
import { soulmates } from './soulmates.ts';
import { sebastian } from './sebastian.ts';
import { fakedating } from './fakedating.ts';
import { noturkey } from './noturkey.ts';

export const CLIPS: readonly Clip[] = [
  waitress,
  datinglang,
  laundromat,
  centralperk,
  furniture,
  annclub,
  bucketList,
  waffleGift,
  possum,
  kathybook,
  soulmates,
  sebastian,
  fakedating,
  noturkey
];
