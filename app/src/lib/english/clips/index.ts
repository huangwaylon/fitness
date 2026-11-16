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
import { prefired } from './prefired.ts';
import { benArrested } from './benarrested.ts';
import { distract } from './distract.ts';
import { leslieRedFlag } from './modelun.ts';
import { banquetHair } from './banquethair.ts';
import { goodHusband } from './goodhusband.ts';
import { promSeason } from './promseason.ts';
import { birthdayMonth } from './birthdaymnth.ts';
import { setStraight } from './setstraight.ts';
import { ronPoetry } from './ronpoetry.ts';
import { firstComplaint } from './firstcomp.ts';
import { leslieAnnForum } from './annforum.ts';
import { joeyStinks } from './joeystinks.ts';
import { benCriminal } from './bencriminal.ts';
import { unsexyRoadTrip } from './roadtrip.ts';
import { senatorOscar } from './senatoroscar.ts';
import { jimBack } from './jimback.ts';
import { ronDiane } from './rondiane.ts';
import { jerryBurritoLie } from './burritolie.ts';
import { beefMilk } from './beefmilk.ts';
import { jerryMugged } from './jerrymugged.ts';
import { ronSlash } from './ronslash.ts';
import { aprilGetFired } from './aprilgetfire.ts';
import { mexBus } from './mexbus.ts';
import { newport } from './newport.ts';
import { animalControl } from './animalctrl.ts';
import { chardStand } from './chardstand.ts';
import { bestBurger } from './bestburger.ts';
import { chickParent } from './chickparent.ts';
import { isSheHot } from './isshehot.ts';
import { vanBidding } from './vanbidding.ts';
import { aprilMen } from './aprilmen.ts';
import { thiefOfJoy } from './thiefjoy.ts';
import { dinnerParty } from './dinnerparty.ts';
import { donnaTweets } from './donnatweets.ts';
import { ronAward } from './ronaward.ts';
import { joeyBroadwayAudition } from './joeyaudition.ts';
import { tomHitsOnAnn } from './tomhitsonann.ts';
import { chairModel } from './chairmodel.ts';
import { benLeslieKiss } from './firstkiss.ts';
import { ronBirthday } from './ronbirthday.ts';
import { benSaves } from './bensaves.ts';
import { mostLovedDenmark } from './loveddenmark.ts';
import { ironkitchen } from './ironkitchen.ts';
import { saveJJs } from './savejjs.ts';
import { ronharass } from './ronharass.ts';
import { donnaPosts } from './donnaposts.ts';
import { ronsTeam } from './ronsteam.ts';
import { newHairdo } from './newhairdo.ts';
import { dwightUrine } from './dwighturine.ts';
import { annLeaving } from './annleaving.ts';
import { ronsReviews } from './ronreviews.ts';
import { charity } from './charity.ts';
import { conflictPranks } from './pranks.ts';
import { parksMakeover } from './parksmakeov.ts';
import { ronChrisCrib } from './roncrib.ts';
import { leslieObama } from './obama.ts';
import { andyAcademy } from './andyacademy.ts';
import { sellVeg } from './sellveg.ts';
import { jerryPainting } from './jerrypaint.ts';
import { ronMeditation } from './meditation.ts';
import { ohTheWall } from './ohthewall.ts';
import { ronDesk } from './rondesk.ts';
import { barbados } from './barbados.ts';
import { jointMission } from './jointmission.ts';
import { theMerger } from './themerger.ts';
import { bookSpoilers } from './bookspoil.ts';
import { thirdNipple } from './thirdnipple.ts';
import { ronAprilTakeOver } from './ronapril.ts';
import { dwightFetish } from './dwightfetish.ts';
import { youngjim } from './youngjim.ts';
import { creedDebbie } from './creeddebbie.ts';
import { possumTaskForce } from './possumtask.ts';
import { annFlowers } from './annflowers.ts';
import { michaelCheerUp } from './cheerupvideo.ts';
import { joeyBrain } from './newbrain.ts';
import { poachBen } from './poachben.ts';
import { canvassing } from './canvassing.ts';
import { rossBreak } from './rossbreak.ts';
import { leslieCancelled } from './lesliecancel.ts';
import { liceOffice } from './liceoffice.ts';
import { monicaMillionaire } from './millionaire.ts';
import { thisIsMyBoyfriendDerek } from './derek.ts';
import { benSkates } from './benskates.ts';

export const CLIPS: readonly Clip[] = [
  // ゆっくり
  waitress,
  datinglang,
  laundromat,
  chickParent,
  sellVeg,
  chairModel,
  ronsReviews,
  mostLovedDenmark,
  poachBen,
  jerryBurritoLie,
  jerryMugged,
  rossBreak,
  dwightFetish,
  thiefOfJoy,
  benSaves,
  charity,
  ronAprilTakeOver,
  gameRoom,
  aprilGetFired,
  youngjim,
  johnnyGoodbye,
  theMerger,
  creedDebbie,
  michaelCheerUp,
  dinnerParty,
  liceOffice,
  thisIsMyBoyfriendDerek,
  newHairdo,
  ronDesk,
  centralperk,
  furniture,
  ronShowHost,
  senatorOscar,
  ronDiane,
  beefMilk,
  andyAcademy,
  annFlowers,
  leslieCancelled,
  jointMission,
  heroes,
  saveJJs,
  buttOfJoke,
  ronSlash,
  mexBus,
  canvassing,
  ronharass,
  annLeaving,
  conflictPranks,
  tobySafety,
  fluSeason,
  banquetHair,
  jansStroller,
  vanBidding,
  ronAward,
  unsexyRoadTrip,
  ronLeslieLocked,
  womensAppreciation,
  // ふつう
  animalControl,
  chardStand,
  leslieObama,
  jimBack,
  setStraight,
  benCriminal,
  ronsTeam,
  twodates,
  ronFire,
  benArrested,
  imFine,
  aprilMen,
  joeyBroadwayAudition,
  tomHitsOnAnn,
  pumpJamm,
  firstComplaint,
  isSheHot,
  ronBirthday,
  parksMakeover,
  phoebeRuns,
  leslieRedFlag,
  dwightDate,
  ronPermit,
  ronMeditate,
  newport,
  bookSpoilers,
  possumTaskForce,
  tomSwagger,
  ronWill,
  benLeslieKiss,
  ronChrisCrib,
  tomNegotiate,
  donnaTweets,
  donnaPosts,
  mamasDead,
  workBestie,
  andySecret,
  dwightUrine,
  scarnRead,
  gryzzlBoxes,
  distract,
  leslieAnnForum,
  ronMeditation,
  oldSchool,
  joeyCrossword,
  pamGivenUp,
  verySober,
  parkspilot,
  prefired,
  whosDaddy,
  joeyBrain,
  benSkates,
  // 速い
  janiceSocks,
  pikitis,
  joeymakeup,
  daveReturns,
  snowCones,
  neverLower,
  ronPatience,
  prairie,
  annVibes,
  babySex,
  screwIt,
  aprilFired,
  runsAgain,
  promSeason,
  getaway,
  evilLaugh,
  fluoride,
  joeyStinks,
  kellyLarson,
  goodHusband,
  jerryPainting,
  pamLabor,
  ronHearing,
  ryanOffice,
  bestBurger,
  couplesOnly,
  annOffended,
  phoebebook,
  bucketList,
  daveex,
  barbados,
  saylove,
  didIStutter,
  waffleGift,
  sideQuest,
  ronPoetry,
  aprilTynnyfer,
  joeyStay,
  annclub,
  disadulation,
  pitchWomen,
  badReview,
  ohTheWall,
  kathybook,
  guysGripe,
  monicaMillionaire,
  savings,
  birthdayMonth,
  collarBlind,
  rossNothing,
  possum,
  ronWhiners,
  thirdNipple,
  emmaLocked,
  perfectCrime,
  fakedating,
  ironkitchen,
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
