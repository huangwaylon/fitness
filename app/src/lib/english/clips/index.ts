// English Study's clips, in the order they're offered (easier first): today's clip is the first not finished yet.
// One line a clip: its file in this folder, its lesson in docs/english.md's shape (lib/english/types.ts Clip).
// clips.test checks every one (ids, segments, choices, the notes, the bands and this order).
// Order: by band (ゆっくり → ふつう → 速い; bandsOf), the first five lessons first as they were; within a band slower
// first, the situation changing from one clip to the next.
import type { Band, Clip } from '../types.ts';
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
import { snowCones } from './snowcones.ts';
import { mamasDead } from './mamasdead.ts';
import { dwightDate } from './dwightdate.ts';
import { scarnRead } from './scarnread.ts';
import { collarBlind } from './collarblind.ts';
import { ryanOffice } from './ryanoffice.ts';
import { womensAppreciation } from './womensapp.ts';
import { buttOfJoke } from './buttjoke.ts';
import { tomSwagger } from './newjerry.ts';
import { getaway } from './getaway.ts';
import { babySex } from './babysex.ts';
import { pamLabor } from './pamlabor.ts';
import { fluSeason } from './fluseason.ts';
import { sideQuest } from './sidequest.ts';
import { evilLaugh } from './evillaugh.ts';
import { guysGripe } from './guysgripe.ts';
import { couplesOnly } from './couplesonly.ts';

export const CLIPS: readonly Clip[] = [
  // ゆっくり
  waitress,
  datinglang,
  laundromat,
  centralperk,
  furniture,
  buttOfJoke,
  twodates,
  fluSeason,
  phoebeRuns,
  womensAppreciation,
  dwightDate,
  tomSwagger,
  mamasDead,
  scarnRead,
  // ふつう
  joeymakeup,
  snowCones,
  babySex,
  getaway,
  evilLaugh,
  bucketList,
  fluoride,
  phoebebook,
  pamLabor,
  saylove,
  ryanOffice,
  waffleGift,
  couplesOnly,
  sideQuest,
  // 速い
  annclub,
  joeyStay,
  guysGripe,
  kathybook,
  collarBlind,
  savings,
  possum,
  rossNothing,
  emmaLocked,
  fakedating,
  seatingChart,
  soulmates,
  noturkey,
  sebastian
];

/** Each wpm's band, the library cut in thirds (types.ts Band): ゆっくり below the ⌊n/3⌋th slowest, 速い from the
 *  ⌊2n/3⌋th on, ふつう between. clips.test holds every clip's band to it; scripts/english-wpm.ts writes them. */
export function bandsOf(wpms: readonly number[]): Band[] {
  const sorted = [...wpms].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length / 3)], hi = sorted[Math.floor((2 * sorted.length) / 3)];
  return wpms.map((w) => (w < lo ? 'slow' : w < hi ? 'mid' : 'fast'));
}
