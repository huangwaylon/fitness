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
import { chrisBestMan } from './bestman.ts';
import { donnaBully } from './donnabully.ts';
import { dwightHobbit } from './hobbit.ts';
import { andyInvestigates } from './andyinvest.ts';
import { ronLeslieLunch } from './ronlunch.ts';
import { treatTurnabout } from './treatturn.ts';
import { giantHead } from './gianthead.ts';
import { kneecapping } from './kneecapping.ts';
import { weddingFund } from './weddingfund.ts';
import { conesOfDunshire } from './dunshire.ts';
import { benCool } from './bencool.ts';
import { benpunch } from './benpunch.ts';
import { fakingIt } from './fakingit.ts';
import { aprilMeetings } from './aprilmeets.ts';
import { ronHumour } from './ronhumour.ts';
import { ronFixes } from './ronfixes.ts';
import { dwightVsDwight } from './dwightself.ts';
import { dwightquits } from './dwightquits.ts';
import { michaelBlastPast } from './blastpast.ts';
import { kevinTalk } from './kevintalk.ts';
import { chrisFlu } from './chrisflu.ts';
import { hypocrite } from './hypocrite.ts';
import { ronSelfDefense } from './ronselfdef.ts';
import { girlyApt } from './girlyapt.ts';
import { monaLisa } from './monalisa.ts';
import { triplets } from './triplets.ts';
import { itGuySecrets } from './itguysecret.ts';
import { rossJill } from './rossjill.ts';
import { loveOverMeat } from './loveovermeat.ts';
import { dwightAppt } from './dwightappt.ts';
import { dwightHimself } from './dwighthimsf.ts';
import { dwightCar } from './dwightcar.ts';
import { tomsApartment } from './tomsapt.ts';
import { wonderDog } from './wonderdog.ts';
import { ronDentist } from './rondentist.ts';
import { ronTough } from './rontough.ts';
import { andyTest } from './andytest.ts';
import { ronTomLucy } from './rontomlucy.ts';
import { annApril } from './annapril.ts';
import { doingAlcohol } from './alcohol.ts';
import { ryankelly } from './ryankelly.ts';
import { movember } from './movember.ts';
import { ambulance } from './ambulance.ts';
import { bloomingdales } from './bloomies.ts';
import { mriBlindDate } from './mridate.ts';
import { fakeCall } from './fakecall.ts';
import { needyCall } from './needycall.ts';
import { dwightFavors } from './dwightfavors.ts';
import { piemary } from './piemary.ts';
import { rossList } from './rosslist.ts';
import { policeExam } from './policeexam.ts';
import { dwightGun } from './dwightgun.ts';
import { offGrid } from './offgrid.ts';
import { whiteWhale } from './whitewhale.ts';
import { ronTooth } from './rontooth.ts';
import { dwightVsAndy } from './dwightandy.ts';
import { deppCondo } from './deppcondo.ts';
import { leslieMom } from './lesliemom.ts';
import { pilotFacts } from './pilotfacts.ts';
import { gellerBowl } from './gellerbowl.ts';
import { costumePrize } from './costumeprize.ts';
import { ronsKey } from './ronskey.ts';
import { zorpVigil } from './zorpvigil.ts';
import { galBrunch } from './galbrunch.ts';
import { videoDome } from './videodome.ts';
import { kingpin } from './kingpin.ts';
import { tomAccent } from './tomaccent.ts';
import { michaelJim } from './michaeljim.ts';
import { textsMean } from './textsmean.ts';
import { leslieReady } from './leslieready.ts';
import { apologyVideos } from './apologyvids.ts';
import { cheesecakeBandits } from './cheesebandit.ts';
import { rossHidesIt } from './rosshides.ts';
import { jerryBack } from './jerryback.ts';
import { threeBachelors } from './bachelors.ts';
import { paperco } from './paperco.ts';
import { tobyTherapy } from './tobytherapy.ts';
import { retreat } from './retreat.ts';
import { andyComputer } from './andycomp.ts';
import { icNewCast } from './icnewcast.ts';
import { rossMarvel } from './rossmarvel.ts';
import { dinnerplan } from './dinnerplan.ts';
import { monicabroke } from './monicabroke.ts';
import { saveBen } from './saveben.ts';
import { nutribars } from './nutribars.ts';
import { germsTalk } from './germstalk.ts';
import { janicedump } from './janicedump.ts';
import { momFlirt } from './momflirt.ts';
import { birthdayGuide } from './birthdays.ts';
import { captainjack } from './captainjack.ts';
import { ronShot } from './ronshot.ts';
import { rentASwag } from './rentaswag.ts';
import { paulManager } from './paulmanager.ts';
import { iChristmas } from './ichristmas.ts';
import { officeLock } from './officelock.ts';
import { prankUtica } from './prankutica.ts';
import { suckit } from './suckit.ts';
import { getIn } from './getin.ts';
import { twilightCapsule } from './twilight.ts';
import { lesliePleads } from './lesliepleads.ts';
import { joeyLie } from './joeylie.ts';
import { pilotOpening } from './pilotopen.ts';
import { benTreats } from './bentreats.ts';
import { discoveringJammy } from './jammy.ts';
import { ronNoRegret } from './ronjamm.ts';
import { snakeJuice } from './snakejuice.ts';
import { joeyParents } from './joeyparents.ts';
import { craigTemp } from './craigtemp.ts';
import { antiHack } from './antihack.ts';
import { tomScreenBan } from './tomscreens.ts';
import { peckJoins } from './peckjoins.ts';
import { pamprank } from './pamprank.ts';
import { dwightVotes } from './dwightvotes.ts';
import { rossMona } from './rossmona.ts';
import { wetCement } from './wetcement.ts';
import { joeyfinds } from './joeyfinds.ts';
import { firstScene } from './firstscene.ts';
import { carlyRoom } from './carlyroom.ts';
import { truffled } from './truffled.ts';
import { benDestress } from './bendestress.ts';
import { chandlerAdopted } from './adopted.ts';
import { ronRadio } from './ronradio.ts';
import { dwightPunch } from './dwightpunch.ts';
import { boyHaveYouLostYourMind } from './lostmind.ts';
import { doNotMock } from './donotmock.ts';
import { medicalMess } from './medicalmess.ts';
import { bonVoyage } from './bonvoyage.ts';
import { iceClown } from './iceclown.ts';
import { apothecaryTable } from './apothecary.ts';
import { pamsMom } from './pamsmom.ts';
import { singlesNight } from './singlesnight.ts';
import { datingCv } from './datingcv.ts';
import { healthPlan } from './healthplan.ts';
import { bigDay } from './bigday.ts';
import { roomie } from './roomie.ts';
import { officeSetUp } from './setup.ts';
import { fakeWedding } from './fakewedding.ts';
import { aprilLeslie } from './aprilleslie.ts';
import { unityQuilt } from './unityquilt.ts';
import { nanaclub } from './nanaclub.ts';
import { aprilWedding } from './aprilwedding.ts';
import { habits } from './habits.ts';
import { ursula } from './ursula.ts';
import { pacMan } from './pacman.ts';
import { tackleBen } from './tackleben.ts';
import { shutdown } from './shutdown.ts';
import { icSetTour } from './icsettour.ts';
import { printfire } from './printfire.ts';
import { ent720 } from './ent720.ts';
import { bossAway } from './bossaway.ts';
import { rachelJob } from './racheljob.ts';
import { housetour } from './housetour.ts';
import { willBeFine } from './willbefine.ts';
import { marbleBox } from './marblebox.ts';
import { daddyDisco } from './daddydisco.ts';
import { charityPick } from './charitypick.ts';
import { andyEyeTest } from './eyetest.ts';
import { rachResume } from './rachresume.ts';
import { chipMcCapp } from './chipmccapp.ts';
import { bobbyMeet } from './bobbymeet.ts';
import { stressSweat } from './stresssweat.ts';
import { aprilMouserat } from './mouserat.ts';
import { asianjim } from './asianjim.ts';
import { leslieDate } from './lesliedate.ts';
import { dwightNewJob } from './dwightjob.ts';
import { joeyDog } from './joeydog.ts';
import { empOfMonth } from './empofmonth.ts';
import { michaelsNephew } from './nephew.ts';
import { lesliesBlackEye } from './blackeye.ts';
import { mykonos } from './mykonos.ts';
import { bigFight } from './bigfight.ts';
import { joeyTeachesActing } from './joeyacting.ts';
import { partyEarly } from './partyearly.ts';
import { leaveTelescope } from './telescope.ts';
import { cakeRush } from './cakerush.ts';
import { lewbJuice } from './lewbjuice.ts';
import { andyJamie } from './andyjamie.ts';
import { gingerbread } from './gingerbread.ts';
import { jerryPlace } from './jerryplace.ts';
import { tomFailure } from './tomfailure.ts';
import { laborroom } from './laborroom.ts';
import { staceySwab } from './staceyswab.ts';
import { samFriend } from './samfriend.ts';
import { creddieTogether } from './creddie.ts';
import { influencerFightClub } from './influfight.ts';
import { icFirstShow } from './icfirstshow.ts';
import { killerTuna } from './killertuna.ts';
import { sandScam } from './sandscam.ts';
import { shelbyFight } from './shelbyfight.ts';
import { grandpaAssistant } from './grandpaasst.ts';
import { firstPrank } from './firstprank.ts';
import { newIcarly } from './newicarly.ts';
import { blindDate } from './blinddate.ts';
import { auditionDisaster } from './auditionmess.ts';
import { mrsBensonCrashes } from './bensondate.ts';
import { lewTrial } from './lewtrial.ts';
import { mysteryParty } from './mysteryparty.ts';
import { spencerRoastsCarly } from './nemesister.ts';
import { realityExposed } from './realityexpo.ts';
import { dutchKiss } from './dutchkiss.ts';
import { replaceHarry } from './replaceharry.ts';
import { spencerFriends } from './spencerfrnds.ts';
import { catFreddie } from './catfreddie.ts';
import { halfoween } from './halfoween.ts';
import { goPublic } from './gopublic.ts';
import { dwightAmyAdams } from './dwightamy.ts';
import { dateMike } from './datemike.ts';
import { ribbing } from './ribbing.ts';

export const CLIPS: readonly Clip[] = [
  // ゆっくり
  spencerFriends,
  catFreddie,
  mysteryParty,
  goPublic,
  spencerRoastsCarly,
  replaceHarry,
  realityExposed,
  halfoween,
  andyJamie,
  lewTrial,
  rossList,
  michaelJim,
  rossMona,
  waitress,
  bloomingdales,
  dinnerplan,
  janicedump,
  movember,
  auditionDisaster,
  datinglang,
  laundromat,
  dwightVsAndy,
  chickParent,
  shelbyFight,
  staceySwab,
  newIcarly,
  chrisFlu,
  monicabroke,
  dutchKiss,
  kevinTalk,
  daddyDisco,
  grandpaAssistant,
  sellVeg,
  needyCall,
  creddieTogether,
  dwightGun,
  michaelsNephew,
  ronFixes,
  chairModel,
  nanaclub,
  ronsReviews,
  leslieReady,
  shutdown,
  sandScam,
  mostLovedDenmark,
  poachBen,
  icFirstShow,
  dwightHobbit,
  doingAlcohol,
  ambulance,
  fakeWedding,
  jerryBurritoLie,
  jerryMugged,
  benCool,
  tobyTherapy,
  mykonos,
  mrsBensonCrashes,
  rossBreak,
  birthdayGuide,
  benTreats,
  ribbing,
  ronHumour,
  mriBlindDate,
  fakeCall,
  ronRadio,
  dwightPunch,
  singlesNight,
  gingerbread,
  dateMike,
  dwightFetish,
  benpunch,
  dwightAppt,
  andyComputer,
  empOfMonth,
  tomFailure,
  killerTuna,
  thiefOfJoy,
  benSaves,
  ronSelfDefense,
  discoveringJammy,
  tackleBen,
  charityPick,
  influencerFightClub,
  firstPrank,
  charity,
  ronAprilTakeOver,
  michaelBlastPast,
  dwightHimself,
  iChristmas,
  pilotOpening,
  pamprank,
  laborroom,
  gameRoom,
  aprilGetFired,
  youngjim,
  aprilMeetings,
  dwightCar,
  tomsApartment,
  wonderDog,
  policeExam,
  captainjack,
  johnnyGoodbye,
  theMerger,
  creedDebbie,
  michaelCheerUp,
  triplets,
  willBeFine,
  dwightAmyAdams,
  dinnerParty,
  liceOffice,
  thisIsMyBoyfriendDerek,
  dwightVsDwight,
  ronDentist,
  ryankelly,
  costumePrize,
  germsTalk,
  suckit,
  dwightVotes,
  wetCement,
  bigDay,
  dwightNewJob,
  leaveTelescope,
  // ふつう
  newHairdo,
  ronDesk,
  partyEarly,
  ronShowHost,
  senatorOscar,
  leslieDate,
  roomie,
  furniture,
  ronDiane,
  marbleBox,
  stressSweat,
  centralperk,
  beefMilk,
  andyAcademy,
  annFlowers,
  leslieCancelled,
  chrisBestMan,
  andyInvestigates,
  ronTough,
  ronsKey,
  rossHidesIt,
  saveBen,
  apothecaryTable,
  pamsMom,
  housetour,
  samFriend,
  jointMission,
  ronLeslieLunch,
  treatTurnabout,
  kneecapping,
  andyTest,
  tobySafety,
  jansStroller,
  vanBidding,
  ronAward,
  threeBachelors,
  nutribars,
  rachelJob,
  cakeRush,
  heroes,
  donnaBully,
  joeyLie,
  carlyRoom,
  officeSetUp,
  joeyDog,
  jerryPlace,
  saveJJs,
  unsexyRoadTrip,
  weddingFund,
  ronNoRegret,
  snakeJuice,
  aprilMouserat,
  buttOfJoke,
  ronSlash,
  mexBus,
  canvassing,
  ronShot,
  firstScene,
  doNotMock,
  datingCv,
  unityQuilt,
  pacMan,
  ronharass,
  annLeaving,
  conflictPranks,
  fluSeason,
  banquetHair,
  ronLeslieLocked,
  womensAppreciation,
  loveOverMeat,
  tomAccent,
  textsMean,
  twilightCapsule,
  habits,
  bossAway,
  lewbJuice,
  animalControl,
  chardStand,
  leslieObama,
  jimBack,
  ronTomLucy,
  ronTooth,
  paulManager,
  setStraight,
  benCriminal,
  ronsTeam,
  jerryBack,
  lesliesBlackEye,
  twodates,
  ronFire,
  benArrested,
  imFine,
  aprilMen,
  blindDate,
  joeyBroadwayAudition,
  tomHitsOnAnn,
  pumpJamm,
  firstComplaint,
  isSheHot,
  ronBirthday,
  parksMakeover,
  monaLisa,
  cheesecakeBandits,
  joeyParents,
  medicalMess,
  iceClown,
  phoebeRuns,
  leslieRedFlag,
  dwightDate,
  ronPermit,
  ronMeditate,
  newport,
  annApril,
  benDestress,
  andyEyeTest,
  bookSpoilers,
  possumTaskForce,
  leslieMom,
  bonVoyage,
  tomSwagger,
  ronWill,
  benLeslieKiss,
  ronChrisCrib,
  girlyApt,
  zorpVigil,
  craigTemp,
  printfire,
  bobbyMeet,
  // 速い
  tomNegotiate,
  donnaTweets,
  donnaPosts,
  rossMarvel,
  aprilWedding,
  mamasDead,
  workBestie,
  hypocrite,
  andySecret,
  dwightUrine,
  conesOfDunshire,
  dwightquits,
  videoDome,
  joeyfinds,
  aprilLeslie,
  scarnRead,
  gryzzlBoxes,
  distract,
  leslieAnnForum,
  ronMeditation,
  rentASwag,
  joeyTeachesActing,
  oldSchool,
  joeyCrossword,
  pamGivenUp,
  verySober,
  rossJill,
  paperco,
  parkspilot,
  prefired,
  whosDaddy,
  joeyBrain,
  benSkates,
  fakingIt,
  offGrid,
  janiceSocks,
  pikitis,
  joeymakeup,
  daveReturns,
  snowCones,
  neverLower,
  ronPatience,
  prairie,
  itGuySecrets,
  lesliePleads,
  antiHack,
  annVibes,
  babySex,
  screwIt,
  galBrunch,
  aprilFired,
  runsAgain,
  promSeason,
  apologyVideos,
  tomScreenBan,
  ent720,
  asianjim,
  getaway,
  evilLaugh,
  whiteWhale,
  fluoride,
  joeyStinks,
  icSetTour,
  kellyLarson,
  goodHusband,
  officeLock,
  chipMcCapp,
  chandlerAdopted,
  dwightFavors,
  ursula,
  jerryPainting,
  icNewCast,
  prankUtica,
  pamLabor,
  piemary,
  healthPlan,
  bigFight,
  momFlirt,
  peckJoins,
  ronHearing,
  ryanOffice,
  bestBurger,
  giantHead,
  couplesOnly,
  annOffended,
  phoebebook,
  bucketList,
  daveex,
  barbados,
  getIn,
  saylove,
  boyHaveYouLostYourMind,
  didIStutter,
  waffleGift,
  pilotFacts,
  sideQuest,
  ronPoetry,
  aprilTynnyfer,
  joeyStay,
  retreat,
  annclub,
  disadulation,
  pitchWomen,
  truffled,
  badReview,
  ohTheWall,
  kathybook,
  guysGripe,
  monicaMillionaire,
  savings,
  birthdayMonth,
  collarBlind,
  deppCondo,
  rossNothing,
  possum,
  ronWhiners,
  thirdNipple,
  emmaLocked,
  perfectCrime,
  kingpin,
  rachResume,
  fakedating,
  ironkitchen,
  seatingChart,
  soulmates,
  pityFudge,
  fiftyYears,
  noturkey,
  sebastian,
  gellerBowl
];

/** Each wpm's band, the library cut in thirds (types.ts Band): ゆっくり below the ⌊n/3⌋th slowest, 速い from the
 *  ⌊2n/3⌋th on, ふつう between. clips.test holds every clip's band to it; scripts/english-wpm.ts writes them. */
export function bandsOf(wpms: readonly number[]): Band[] {
  const sorted = [...wpms].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length / 3)], hi = sorted[Math.floor((2 * sorted.length) / 3)];
  return wpms.map((w) => (w < lo ? 'slow' : w < hi ? 'mid' : 'fast'));
}
