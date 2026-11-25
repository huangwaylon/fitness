// The special characters' roles (docs/design.md "Visitors: roles"), pure. NH's other special characters are visitors
// like the weekday ones (visitors.ts ROTATION: the one visitor of the day, the user 2026-11-25); each has a role, data
// here, and the one framework (visitor.svelte.ts) plays it:
// - `chat`: their introduction and a few lines (as every visitor);
// - `shop`: a few pieces of furniture of their own for the day (visitorShop.ts offerOf), bought as the shop's are
//   (shop/stock.ts buyPiece: NH's ÷20 prices, the record's checks), in their sheet (VisitorShop.svelte);
// - `gift`: a piece for the island's もようがえ (a present's find: the ずかん's みつけた), once a visit, to whoever talks
//   to them first, the same piece on every phone (giftOf);
// - `fortune`: Katrina's reading of the day, each person's own, the same on their phones all day (fortuneOf);
// - `fish`: Wendell, washed up hungry on the beach: the next fish caught that day feeds him, and he gives a piece;
// - `cheer`: Chip (the fish) and Nat (the bugs) watch the catches, a cheer at each one of their kind while they're here.
// They stand where every visitor does (the plaza's mark, spots.ts stageOf); the beach ones (Gullivarrr, Wendell) wash up
// on Gulliver's beach (spots.ts washedUp), by day only (06:00–18:00). Pavé dances on Festivale (NH's: the Monday 48
// days before Easter), outside the rotation.
// Not visitors (their role is elsewhere): Resetti in the editor's island reset, Booker and Copper at the pairing
// page's gate. The rest, with models but no sensible role on our island, are in the ずかん's cast only (CAST below).
import { ISLAND_SEED, dayRand } from './daySeed.ts';

export type SpecialId = 'gracie' | 'wardell' | 'katrina' | 'wendell' | 'gullivarrr' | 'pete' | 'leilani' | 'lottie' | 'chip' | 'nat'
  | 'rover' | 'shrunk' | 'tortimer' | 'phineas' | 'pave';
type RoleKind = 'chat' | 'shop' | 'gift' | 'fortune' | 'fish' | 'cheer';
interface Role {
  kind: RoleKind;
  /** Washed up on Gulliver's beach (by day), not on the plaza. */
  beach?: true;
  /** A shop's pieces: NH's dearer ones (`dear`: Gracie's fine furniture) or any. */
  pool?: 'dear' | 'any';
  /** What a cheer watches for. */
  cheer?: 'fish' | 'bug';
}
export const ROLES: Readonly<Record<SpecialId, Role>> = {
  gracie: { kind: 'shop', pool: 'dear' },
  wardell: { kind: 'shop', pool: 'any' },
  katrina: { kind: 'fortune' },
  wendell: { kind: 'fish', beach: true },
  gullivarrr: { kind: 'chat', beach: true },
  pete: { kind: 'gift' },
  leilani: { kind: 'gift' },
  lottie: { kind: 'gift' },
  chip: { kind: 'cheer', cheer: 'fish' },
  nat: { kind: 'cheer', cheer: 'bug' },
  rover: { kind: 'chat' },
  shrunk: { kind: 'chat' },
  tortimer: { kind: 'chat' },
  phineas: { kind: 'chat' },
  pave: { kind: 'chat' }
};
/** Their NH codes (NpcSp<Code>: the models, the ずかん's icons). */
const CODES: Readonly<Record<SpecialId, string>> = {
  gracie: 'grf', wardell: 'man', katrina: 'bpt', wendell: 'wrl', gullivarrr: 'gulB', pete: 'plo', leilani: 'kpm', lottie: 'otg', chip: 'bev',
  nat: 'chm', rover: 'xct', shrunk: 'upa', tortimer: 'ttlA', phineas: 'fsl', pave: 'pck'
};
/** The special characters in the visitors' rotation (Pavé only on Festivale). */
export const SPECIALS: readonly SpecialId[] = ['gracie', 'wardell', 'katrina', 'wendell', 'gullivarrr', 'pete', 'leilani', 'lottie', 'chip', 'nat', 'rover', 'shrunk', 'tortimer', 'phineas'];
export const isSpecial = (id: string): id is SpecialId => Object.hasOwn(ROLES, id);

/** Katrina's reading for one person on a day: a luck (0 the best … 4) and a lucky colour (indices: the lines' keys). */
export const LUCKS = 5, COLOURS = 8;
export function fortuneOf(date: string, who: string, seed = ISLAND_SEED): { luck: number; colour: number } {
  const r = dayRand(date, `fortune:${who}`, seed);
  // (NH's: the best and the worst the rarest)
  const x = r(), luck = x < 0.12 ? 0 : x < 0.42 ? 1 : x < 0.78 ? 2 : x < 0.94 ? 3 : 4;
  return { luck, colour: Math.floor(r() * COLOURS) };
}

/** The piece a special character gives on a day (a present's furniture the rooms can place: catalog.ts treeFurniture, less what the
 *  island had found by the day's start), the same on every phone; null: nothing left to give. */
export function giftOf(id: SpecialId, date: string, pool: readonly string[], found: ReadonlySet<string>, seed = ISLAND_SEED): string | null {
  const left = pool.filter((p) => !found.has(p));
  return left.length ? left[Math.floor(dayRand(date, `guest-gift:${id}`, seed)() * left.length)] : null;
}

/** NH's special characters (their roster id, NH's code), each in the ずかん's cast with its role here: a visitor's
 *  (`visit`: the rotation, Sunday's Daisy Mae, an event's host), elsewhere (`shop`: the shop's twins,
 *  `museum`, `stool`: K.K., `reset`: Resetti, `gate`: Booker and Copper, `roster`: a villager to choose), or `none`:
 *  in the cast only. */
export type CastRole = 'visit' | 'shop' | 'museum' | 'stool' | 'reset' | 'gate' | 'roster' | 'none';
export const CAST: readonly (readonly [id: string, code: string, role: CastRole])[] = [
  ['tom-nook', 'rco', 'roster'], ['isabelle', 'sza', 'roster'], ['timmy', 'rcm', 'shop'], ['tommy', 'rct', 'shop'], ['blathers', 'owl', 'museum'],
  ['kk-slider', 'tkkA', 'stool'], ['daisy-mae', 'boc', 'visit'], ['wisp', 'gstA', 'visit'], ['gulliver', 'gul', 'visit'], ['kicks', 'skk', 'visit'],
  ['label', 'hgc', 'visit'], ['saharah', 'cml', 'visit'], ['leif', 'slo', 'visit'], ['redd', 'fox', 'visit'], ['cj', 'bey', 'visit'], ['flick', 'chy', 'visit'],
  ['celeste', 'ows', 'visit'], ['jack', 'pkn', 'visit'], ['franklin', 'tuk', 'visit'], ['jingle', 'rei', 'visit'], ['zipper', 'pyn', 'visit'],
  ['reese', 'alw', 'visit'], ['cyrus', 'alp', 'visit'],
  ...SPECIALS.map((g) => [g, CODES[g], 'visit'] as const), ['pave', 'pck', 'visit'],
  ['resetti', 'mol', 'reset'], ['booker', 'dgb', 'gate'], ['copper', 'dga', 'gate'],
  ['mabel', 'hgh', 'roster'], ['sable', 'hgs', 'roster'], ['brewster', 'pge', 'roster'], ['harvey', 'spn', 'roster'], ['kappn', 'kpp', 'roster'],
  ['pascal', 'seo', 'roster'], ['orville', 'dod', 'roster'], ['wilbur', 'doc', 'roster'],
  ['blanca', 'mka', 'none'], ['digby', 'szo', 'none'], ['don', 'mob', 'none'], ['grams', 'kpg', 'none'], ['harriet', 'poo', 'none'], ['joan', 'boa', 'none'],
  ['katie', 'lom', 'none'], ['leila', 'kps', 'none'], ['luna', 'tap', 'none'], ['lyle', 'ott', 'none'], ['niko', 'mnc', 'none'], ['pelly', 'plk', 'none'],
  ['phyllis', 'plm', 'none'], ['porter', 'mnk', 'none']
];
/** NH's head icons that are one picture (the twins'): one file, static/room/npc/<id>.webp (scripts/npc-icons.ts). */
const SAME_ICON: Readonly<Record<string, string>> = { tommy: 'timmy' };
/** A cast member's head icon's file id. */
export const npcIcon = (id: string): string => SAME_ICON[id] ?? id;
