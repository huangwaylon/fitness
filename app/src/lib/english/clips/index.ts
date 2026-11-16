// English Study's clips, in the order they're offered (easier first): today's clip is the first not finished yet.
// One line a clip: its file in this folder, its lesson in docs/english.md's shape (lib/english/types.ts Clip).
// clips.test checks every one (ids, segments, choices, the notes).
// Order: by band (ゆっくり → ふつう → 速い), the first five lessons as they were; then the banks of 2026-11-16 (all 速い),
// slower first, the situation changing from one to the next.
import type { Clip } from '../types.ts';
import { waitress } from './waitress.ts';
import { centralperk } from './centralperk.ts';
import { furniture } from './furniture.ts';
import { laundromat } from './laundromat.ts';
import { datinglang } from './datinglang.ts';
import { twodates } from './twodates.ts';
import { fluoride } from './fluoride.ts';
import { phoebeRuns } from './phoebe-runs.ts';
import { bucketList } from './bucketlist.ts';
import { waffleGift } from './wafflegift.ts';
import { saylove } from './saylove.ts';
import { joeymakeup } from './joeymakeup.ts';
import { phoebebook } from './phoebebook.ts';
import { possum } from './possum.ts';
import { joeyStay } from './joeystay.ts';
import { annclub } from './annclub.ts';
import { kathybook } from './kathybook.ts';
import { savings } from './savings.ts';
import { rossNothing } from './rossnothing.ts';
import { emmaLocked } from './emmalocked.ts';
import { fakedating } from './fakedating.ts';
import { soulmates } from './soulmates.ts';
import { sebastian } from './sebastian.ts';
import { seatingChart } from './seatingchart.ts';
import { noturkey } from './noturkey.ts';

export const CLIPS: readonly Clip[] = [
  waitress,
  datinglang,
  laundromat,
  centralperk,
  furniture,
  twodates,
  fluoride,
  phoebeRuns,
  bucketList,
  waffleGift,
  saylove,
  joeymakeup,
  phoebebook,
  possum,
  joeyStay,
  annclub,
  kathybook,
  savings,
  rossNothing,
  emmaLocked,
  fakedating,
  soulmates,
  sebastian,
  seatingChart,
  noturkey
];
