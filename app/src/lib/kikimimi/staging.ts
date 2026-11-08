// ききみみ クイズ: how level 4's items are staged (docs/kikimimi.md "Visuals", docs/curriculum.md "Visual rules"): where each is heard
// (its scene backdrop) and how (its channel), and the sound marks shown over the revealed text. bank4.ts and
// dialogues.ts fold these into their items (`scene`, `channel`, `marks`; a dialogue line's marks by its clip id).
//   Scenes: the 8 painted backdrops. A setting with none of its own (a hotel desk, the gym, a ferry terminal, a repair
// shop) gets none: the plain stage, or a frame over paper. Calls are heard at home (living) unless they're work's
// (office). A backdrop never shows an answer: the 8 hold no text, numbers or outcome (the station clock's time is never
// asked).
//   Channels: a PA announcement `pa`, a call or a voicemail `phone`, a video meeting `video`; the rest face to face.
// Where the item's `tags.conditions` already say it (bank.ts channelOf), the channel isn't repeated here.
//   Marks: every item or line with a `tts` respelling has them: the reduced shape above the spelling (`say`: lemme,
// gonna, a number as said), the joins (`link`), the swallowed letters (`drop`), the stressed words (`stress`).
//   Noise (`NOISE`): a speech condition where the scene has one (docs/kikimimi-engine.md "Conditions"): a café's murmur, a
// street, a station or an airport concourse; mostly light (+15 dB), heavy (+10 dB) only where the noise is the scene's
// point (Thanksgiving plans over a packed café) or the meaning survives it (a ferry PA in the wind: what it means, not a
// number). `word` items stay clean: their contrasts are fine detail, and level 4 stays fair. A phone or PA channel
// with no entry gets its light condition anyway (conditions.ts condOf).
import type { Channel, Cond, Item, SceneId, SoundMark } from './bank.ts';
import { g } from './content/build.ts';

/** item id → [scene | null, channel?] (the channel only where `tags.conditions` don't give it). */
export const PLACES: Readonly<Record<string, readonly [SceneId | null, Channel?]>> = {
  // reply
  'r4-overbooked': ['gate'], 'r4-room-ready': [null], 'r4-anything-else': ['pharmacy'], 'r4-triage': ['living'],
  'r4-reschedule': ['living'], 'r4-leak': ['living'], 'r4-noise': ['street'], 'r4-parcel': ['living'], 'r4-cut-out': ['office'],
  'r4-weekend': ['office'], 'r4-lunch': ['office'], 'r4-tricky': ['office'], 'r4-feedback': ['office'], 'r4-housewarming': ['street'],
  'r4-come-up': ['living'], 'r4-name': ['cafe'], 'r4-not-fussed': ['street'], 'r4-so-done': ['cafe'], 'r4-ginza': ['platform'],
  'r4-store-credit': [null], 'r4-service-charge': ['cafe'],
  // mean
  'm4-upgrade': [null], 'm4-see-what': ['living'], 'm4-brilliant': ['living'], 'm4-not-ideal': ['office'], 'm4-not-bad': ['office'],
  'm4-easy': ['living'], 'm4-swing-by': ['street'], 'm4-be-good': ['street'], 'm4-freezing': ['living'], 'm4-cat': ['living'],
  'm4-put-through': ['living'], 'm4-half-price': ['living'], 'm4-gift-card': ['living'], 'm4-damp': ['living'], 'm4-interesting': ['office'],
  'm4-dessert': ['cafe'], 'm4-way-down': [null], 'm4-sailings': [null],
  // word
  'w4-shouldve': ['gate'], 'w4-wouldnt-have': ['living'], 'w4-cant-uk': ['living'], 'w4-wanna': ['living'], 'w4-gotta': ['platform'],
  'w4-didja': ['gate'], 'w4-them': [null], 'w4-a-lot-of': ['office'], 'w4-were-gonna': ['gate'], 'w4-can-us': ['living'],
  'w4-id-ill': ['living'], 'w4-youll-need': [null], 'w4-better': ['office'], 'w4-dunno': ['street'], 'w4-lemme': ['living'],
  // num
  'n4-platform': ['street'], 'n4-gate': ['gate'], 'n4-pounds': ['pharmacy'], 'n4-dollars': [null], 'n4-yen': ['living'],
  'n4-water': [null], 'n4-reference': ['living'], 'n4-half-nine': ['living'], 'n4-highs': ['living'], 'n4-flight': ['gate'],
  'n4-claim': ['living'], 'n4-split': ['cafe'], 'n4-reps': [null],
  // dialogues
  'd4-oat-latte': ['cafe'], 'd4-train-cancelled': ['platform'], 'd4-receptionist': ['living'], 'd4-friend-cancels': ['living'],
  'd4-meeting-room': ['office'], 'd4-wrong-dish': ['cafe'], 'd4-landlord': ['living'], 'd4-neighbour-party': ['door'],
  'd4-gate-change': ['gate'], 'd4-squat-form': [null], 'd4-parcel': ['door'], 'd4-store-credit': ['street'], 'd4-taxi-street': ['street'],
  'd4-grab-lunch': ['office'], 'd4-video-call': ['office'], 'd4-pizza-diet': ['street'], 'd4-cough-drive': ['street'],
  'd4-installer': ['living'], 'd4-service-charge': ['cafe'], 'd4-misheard-name': ['cafe'], 'd4-im-easy': ['living'],
  'd4-hotel-suite': [null], 'd4-bank-scam': ['living'], 'd4-ferry-off': [null],
  // the アナウンス pack (level 5): on the platform, in the train (none), at the gate, a call or a voicemail at home, in a
  // shop, a mall, a theater, a museum or on a cruise ship (none), a ballpark and a school's pickup line (the street), the
  // office's alarm test, the radio in a café
  'a5-track': ['street'], 'a5-behind': [null], 'a5-final-call': ['gate'], 'a5-gate-moved': [null], 'a5-boarding-time': [null],
  'a5-press-three': ['living'], 'a5-queue': ['living'], 'a5-dentist': ['living'], 'a5-key-code': ['living'], 'a5-closing': [null],
  'a5-coats': [null], 'a5-typhoon': ['cafe'], 'a5-suspended': ['platform'], 'a5-other-side': [null], 'a5-wind': [null],
  'a5-burst-pipe': ['living'], 'a5-cover-shift': ['living'], 'a5-alarm-test': ['office'], 'a5-high-volume': ['living'],
  'a5-passing': ['street'], 'a5-alight': [null], 'a5-last-train': ['platform'], 'a5-plumber': ['living'], 'a5-rows': ['gate'],
  'a5-reason': ['living'], 'a5-intercom': ['platform'], 'a5-make-known': [null], 'a5-leave-message': ['living'],
  'a5-did-you-say': ['living'], 'a5-out-of-service': ['platform']
};

const light = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'light', ...(bed && { bed }) });
const heavy = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'heavy', ...(bed && { bed }) });

/** item id → its speech condition, where the scene gives it noise (level 4; the アナウンス pack writes its own). */
export const NOISE: Readonly<Record<string, Cond>> = {
  // a café
  'r4-name': light('cafe'), 'r4-so-done': light('cafe'), 'r4-service-charge': light('cafe'), 'm4-dessert': light('cafe'), 'n4-split': light('cafe'),
  'd4-oat-latte': light('cafe'), 'd4-wrong-dish': light('cafe'), 'd4-service-charge': light('cafe'), 'd4-misheard-name': heavy('cafe'),
  // a station, a platform PA, an airport's concourse
  'r4-ginza': light('station'), 'd4-train-cancelled': light('station'), 'n4-gate': light('pa', 'station'),
  'r4-overbooked': light('station'), 'd4-gate-change': light('station'),
  // a street
  'r4-not-fussed': light('street'), 'm4-swing-by': light('street'), 'd4-taxi-street': light('street'), 'd4-pizza-diet': light('street'),
  // a friend calling from outside; a ferry PA in the wind
  'd4-friend-cancels': light('phone', 'street'), 'm4-sailings': heavy('pa')
};


/** clip id (an item's, or a dialogue line's `<item>-<n>`) → its sound marks. */
export const MARKS: Readonly<Record<string, readonly SoundMark[]>> = {
  'r4-reschedule': [['link', 'move it'], ['say', '24', 'twenty-four']],
  'r4-noise': [['say', 'kind of', 'kinda']],
  'r4-service-charge': [['say', '18%', 'eighteen percent'], ['say', 'Did you', 'didja']],
  'm4-swing-by': [['say', 'try and', "try 'n'"], ['link', 'swing by']],
  'm4-be-good': [g('watching')],
  'm4-cat': [['say', 'you', 'ya']],
  'm4-put-through': [['say', 'Let me', 'lemme'], ['link', 'put you']],
  'w4-shouldve': [['say', "should've", 'shoulda'], g('going')],
  'w4-wouldnt-have': [['say', "wouldn't have", "wouldn't've"]],
  'w4-wanna': [['say', 'Do you', "d'you"], ['say', 'want to', 'wanna']],
  'w4-gotta': [['say', 'got to', 'gotta']],
  'w4-didja': [['say', 'Did you', 'didja']],
  'w4-them': [['link', 'bring them'], ['say', 'them', "'em"]],
  'w4-a-lot-of': [['link', 'got a'], ['say', 'a lot of', 'a lotta']],
  'w4-were-gonna': [['say', 'going to', 'gonna']],
  'w4-dunno': [['say', "I don't know", 'dunno']],
  'w4-lemme': [['say', 'Let me', 'lemme'], ['link', 'pull up']],
  'n4-platform': [['say', '40', 'FORty'], g('looking'), ['say', '$43.20', 'forty-three twenty']],
  'n4-gate': [['say', '815', 'eight fifteen'], ['say', '50', 'FIFty'], ['say', '15', 'fifTEEN']],
  'n4-pounds': [['say', '$8.49', 'eight forty-nine'], ['say', 'Do you', "d'you"]],
  'n4-dollars': [g('looking'), ['say', '$340', 'three-forty']],
  'n4-yen': [['say', '¥68,000', 'sixty-eight thousand yen'], ['say', '¥5,000', 'five thousand']],
  'n4-water': [['say', '10', 'ten'], ['stress', '5 1']],
  'n4-reference': [['say', '47092', 'four-seven-oh, nine-two']],
  'n4-highs': [['say', '13', 'thirTEEN']],
  'n4-flight': [['say', '9:05', 'nine-oh-five'], ['say', '762', 'seven six two']],
  'n4-claim': [['say', '30th', 'THIRtieth']],
  'n4-split': [['say', '$46.80', 'forty-six eighty'], ['say', '$47', 'forty-seven']],
  'n4-reps': [['say', '12', 'twelve'], ['stress', 'Actually'], ['say', '15', 'fifTEEN']],
  'd4-oat-latte-3': [['say', 'Let me', 'lemme'], ['link', 'remake it'], ['say', 'you', 'ya']],
  'd4-train-cancelled-1': [['say', '8:40', 'eight forty']],
  'd4-receptionist-2': [['say', '20th', 'TWENtieth']],
  'd4-receptionist-4': [['say', '20th', 'TWENtieth']],
  'd4-gate-change-2': [['say', '52', 'fifty-two']],
  'd4-squat-form-3': [['say', 'kind of', 'kinda'], g('sitting'), ['say', 'you', 'ya']],
  'd4-parcel-1': [['say', '12B', 'twelve B']],
  'd4-parcel-3': [['say', 'and', "an'"], ['link', 'leave a']],
  'd4-taxi-street-4': [['say', 'you', 'ya']],
  'd4-pizza-diet-1': [['say', 'Want to', 'wanna']],
  'd4-pizza-diet-2': [['say', 'kind of', 'kinda'], g('trying')],
  'd4-installer-3': [['say', 'kind of', 'kinda']],
  'd4-service-charge-1': [['link', 'Hang on'], ['say', '15%', 'fifteen percent']],
  'd4-im-easy-1': [['say', 'What do you', 'whaddaya'], ['say', 'want to', 'wanna']],
  // the アナウンス pack
  'a5-track': [['say', '7:05', 'seven-oh-five'], ['say', '7:45', 'seven forty-five']],
  'a5-behind': [['say', '15', 'fifTEEN']],
  'a5-final-call': [['say', '212', 'two-twelve'], ['say', '64', 'sixty-four']],
  'a5-gate-moved': [['say', '7:30', 'seven thirty'], ['say', '9:15', 'nine fifTEEN']],
  'a5-boarding-time': [['say', '4:30', 'four thirty'], ['say', '5', 'five']],
  'a5-press-three': [['link', 'lost or stolen'], ['stress', '3']],
  'a5-queue': [['stress', '6 12']],
  'a5-dentist': [['say', '14th', 'fourTEENTH'], ['say', '3:15', 'three fifteen']],
  'a5-key-code': [['say', '90', 'NINEty'], ['say', 'you', 'ya']],
  'a5-closing': [['say', '15', 'fifTEEN'], ['say', '8', 'eight']],
  'a5-coats': [['say', '30', 'THIRty'], ['say', '40%', 'FORty percent']],
  'a5-typhoon': [['say', '90', 'NINEty'], ['say', '40', 'FORty']],
  'a5-cover-shift': [['say', 'and', "an'"], ['say', 'give me', 'gimme'], g('morning')],
  'a5-plumber': [g('running'), ['link', 'hold your']],
  'a5-rows': [['say', '30', 'THIRty']],
  'a5-leave-message': [['say', 'Dr', 'Doctor'], ['say', '2', 'two']],
  'a5-out-of-service': [['link', 'not in'], ['say', '2', 'two']]
};

/** An item's staging: its scene, its channel when the conditions don't give it, its sound marks, its noise. */
export function staged(id: string): Pick<Item, 'scene' | 'channel' | 'marks' | 'cond'> {
  const [scene, channel] = PLACES[id] ?? [null];
  return { ...(scene && { scene }), ...(channel && { channel }), ...(MARKS[id] && { marks: MARKS[id] }), ...(NOISE[id] && { cond: NOISE[id] }) };
}
