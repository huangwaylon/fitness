// English Study's clips. One line a clip: its file in this folder, its lesson in docs/english.md's shape
// (lib/english/types.ts Clip). clips.test checks every one (ids, segments, choices, the notes, the bands and that the
// list goes by band). The order offered isn't this list's but the shared plan's (plan.ts, plan-order.ts: the build
// orders the index by it). Here: by band (ゆっくり → ふつう → 速い; bandsOf), within a band slower first.
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
import { imFine } from './imfine.ts';
import { annOffended } from './annoffended.ts';
import { annVibes } from './annvibes.ts';
import { ronMeditate } from './ronmeditate.ts';
import { pitchWomen } from './pitchwomen.ts';
import { ronLeslieLocked } from './ronleslie.ts';
import { perfectCrime } from './perfectcrime.ts';
import { fiftyYears } from './fiftyyears.ts';
import { ronHearing } from './ronhearing.ts';
import { pityFudge } from './pityfudge.ts';
import { whosDaddy } from './whosdaddy.ts';
import { aprilFired } from './aprilfired.ts';
import { disadulation } from './disadulation.ts';
import { oldSchool } from './oldschool.ts';
import { ronWhiners } from './ronwhiners.ts';
import { janiceSocks } from './janicesocks.ts';
import { kellyLarson } from './kellylarson.ts';
import { workBestie } from './workbestie.ts';
import { pamGivenUp } from './pamgivenup.ts';
import { daveReturns } from './davereturns.ts';
import { joeyCrossword } from './crossword.ts';
import { ronShowHost } from './ronhost.ts';
import { ronPermit } from './ronpermit.ts';
import { tobySafety } from './tobysafety.ts';
import { pikitis } from './pikitis.ts';
import { didIStutter } from './stutter.ts';
import { prairie } from './prairie.ts';
import { aprilTynnyfer } from './tynnyfer.ts';
import { jansStroller } from './stroller.ts';
import { ronWill } from './ronwill.ts';
import { neverLower } from './neverlower.ts';
import { tomNegotiate } from './tomdeal.ts';
import { parkspilot } from './parkspilot.ts';
import { ronFire } from './ronfire.ts';
import { heroes } from './heroes.ts';
import { runsAgain } from './runsagain.ts';
import { gryzzlBoxes } from './gryzzlbox.ts';
import { pumpJamm } from './pumpjamm.ts';
import { screwIt } from './screwit.ts';
import { ronPatience } from './ronpatience.ts';
import { badReview } from './badreview.ts';
import { gameRoom } from './gameroom.ts';
import { johnnyGoodbye } from './johnnybye.ts';
import { daveex } from './daveex.ts';
import { verySober } from './verysober.ts';
import { andySecret } from './andysecret.ts';

export const CLIPS: readonly Clip[] = [
  // ゆっくり
  waitress,
  datinglang,
  laundromat,
  gameRoom,
  johnnyGoodbye,
  centralperk,
  furniture,
  ronShowHost,
  heroes,
  buttOfJoke,
  twodates,
  tobySafety,
  fluSeason,
  ronFire,
  pumpJamm,
  phoebeRuns,
  jansStroller,
  ronLeslieLocked,
  womensAppreciation,
  imFine,
  dwightDate,
  ronPermit,
  ronMeditate,
  tomSwagger,
  ronWill,
  tomNegotiate,
  mamasDead,
  workBestie,
  andySecret,
  // ふつう
  scarnRead,
  gryzzlBoxes,
  oldSchool,
  joeyCrossword,
  pamGivenUp,
  verySober,
  parkspilot,
  janiceSocks,
  pikitis,
  joeymakeup,
  whosDaddy,
  daveReturns,
  snowCones,
  neverLower,
  ronPatience,
  annVibes,
  prairie,
  babySex,
  screwIt,
  aprilFired,
  runsAgain,
  getaway,
  evilLaugh,
  fluoride,
  kellyLarson,
  pamLabor,
  ronHearing,
  ryanOffice,
  // 速い
  couplesOnly,
  annOffended,
  phoebebook,
  bucketList,
  daveex,
  saylove,
  didIStutter,
  waffleGift,
  sideQuest,
  aprilTynnyfer,
  joeyStay,
  annclub,
  disadulation,
  pitchWomen,
  badReview,
  kathybook,
  guysGripe,
  savings,
  collarBlind,
  rossNothing,
  possum,
  ronWhiners,
  emmaLocked,
  perfectCrime,
  fakedating,
  seatingChart,
  soulmates,
  pityFudge,
  fiftyYears,
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
