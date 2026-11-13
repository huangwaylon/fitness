// The special characters' roles (docs/design.md "Visitors: roles"), pure. NH's other special characters come as
// occasional guests through the visitors' one slot (visitors.ts): each has a role, data here, and the one framework
// (Visitor.svelte) plays it:
// - `chat`: their introduction and a few lines (as every visitor);
// - `shop`: a few pieces of furniture of their own for the day (visitorShop.ts offerOf), bought as the shop's are
//   (shop/stock.ts buyPiece: NH's ÷20 prices, the record's checks), in their sheet (VisitorShop.svelte);
// - `gift`: a piece for the island's もようがえ (a present's find: the ずかん's みつけた), once a visit, to whoever talks
//   to them first, the same piece on every phone (giftOf);
// - `fortune`: Katrina's reading of the day, each person's own, the same on their phones all day (fortuneOf);
// - `fish`: Wendell, washed up hungry on the beach: the next fish caught that day feeds him, and he gives a piece;
// - `cheer`: Chip (the fish) and Nat (the bugs) watch the catches, a cheer at each one of their kind while they're here.
// When: one guest every day (the user, 2026-11-10), 06:00–22:00, in a slot of their own beside the visitors' (visitors.ts
// guestNow: NH's weekday visitors, Daisy Mae and the events' hosts keep theirs), at the guest spot the editor puts down
// (layout/spots.ts guestSpot; none: centre stage, beside the day's visitor when one stands there); each guest once
// before any comes again (a seeded cycle of the guests, by the date: both phones agree). Pavé dances on Festivale (NH's:
// the Monday 48 days before Easter), the visitors' slot. Beach guests (Gullivarrr, Wendell) wash up on Gulliver's
// beach, by day only (06:00–18:00), at the guest spot on a day Gulliver lies there.
// Not visitors (their role is elsewhere): Resetti in the editor's island reset, Booker and Copper at the pairing
// page's gate. The rest, with models but no sensible role on our island, are in the ずかん's cast only (CAST below).
import { shuffle } from '#lib/random.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';

export type GuestId = 'gracie' | 'wardell' | 'katrina' | 'wendell' | 'gullivarrr' | 'pete' | 'leilani' | 'lottie' | 'chip' | 'nat'
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
export const ROLES: Readonly<Record<GuestId, Role>> = {
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
const CODES: Readonly<Record<GuestId, string>> = {
  gracie: 'grf', wardell: 'man', katrina: 'bpt', wendell: 'wrl', gullivarrr: 'gulB', pete: 'plo', leilani: 'kpm', lottie: 'otg', chip: 'bev',
  nat: 'chm', rover: 'xct', shrunk: 'upa', tortimer: 'ttlA', phineas: 'fsl', pave: 'pck'
};
/** The guests' cycle (Pavé only on Festivale). */
export const GUESTS: readonly GuestId[] = ['gracie', 'wardell', 'katrina', 'wendell', 'gullivarrr', 'pete', 'leilani', 'lottie', 'chip', 'nat', 'rover', 'shrunk', 'tortimer', 'phineas'];
export const isGuest = (id: string): id is GuestId => Object.hasOwn(ROLES, id);

/** Whole days from 2026-01-05 to `date`. */
const dayNo = (date: string): number => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-01-05T00:00:00Z')) / 86_400_000);
/** A cycle's order of the guests (seeded by the cycle): never the last cycle's last guest first (no guest two days
 *  running across cycles). */
function cycleOf(cycle: number, seed: string): GuestId[] {
  const order = shuffle([...GUESTS], dayRand(`cycle-${cycle}`, 'guests', seed));
  if (cycle !== 0) {
    const prev = shuffle([...GUESTS], dayRand(`cycle-${cycle - 1}`, 'guests', seed)), last = prev[prev.length - 1];
    if (order[0] === last) [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}
/**
 * The day's guest (the user, 2026-11-10: one every day): the cycle's next, each guest once in a cycle before any comes
 * again (each cycle its own seeded order), by the date: both phones agree.
 */
export function guestOn(date: string, seed = ISLAND_SEED): GuestId {
  const d = dayNo(date), n = GUESTS.length, cycle = Math.floor(d / n);
  return cycleOf(cycle, seed)[((d % n) + n) % n];
}

/** A guest's hours: 06:00–22:00 (the beach guests' by day, 06:00–18:00), till 18:00 on a Saturday (K.K.'s show). */
export function guestHere(id: GuestId, hour: number, weekday: number): boolean {
  const to = Math.min(ROLES[id].beach ? 18 : 22, weekday === 6 ? 18 : 24);
  return hour >= 6 && hour < to;
}

/** Katrina's reading for one person on a day: a luck (0 the best … 4) and a lucky colour (indices: the lines' keys). */
export const LUCKS = 5, COLOURS = 8;
export function fortuneOf(date: string, who: string, seed = ISLAND_SEED): { luck: number; colour: number } {
  const r = dayRand(date, `fortune:${who}`, seed);
  // (NH's: the best and the worst the rarest)
  const x = r(), luck = x < 0.12 ? 0 : x < 0.42 ? 1 : x < 0.78 ? 2 : x < 0.94 ? 3 : 4;
  return { luck, colour: Math.floor(r() * COLOURS) };
}

/** The piece a guest gives on a day (a present's furniture the rooms can place: catalog.ts treeFurniture, less what the
 *  island had found by the day's start), the same on every phone; null: nothing left to give. */
export function giftOf(id: GuestId, date: string, pool: readonly string[], found: ReadonlySet<string>, seed = ISLAND_SEED): string | null {
  const left = pool.filter((p) => !found.has(p));
  return left.length ? left[Math.floor(dayRand(date, `guest-gift:${id}`, seed)() * left.length)] : null;
}

/** NH's special characters (their roster id, NH's code), each in the ずかん's cast with its role here: a visitor's
 *  (`visit`: the weekday rotation, Sunday's Daisy Mae, an event's host, a guest), elsewhere (`shop`: the shop's twins,
 *  `museum`, `stool`: K.K., `reset`: Resetti, `gate`: Booker and Copper, `roster`: a villager to choose), or `none`:
 *  in the cast only. */
export type CastRole = 'visit' | 'guest' | 'shop' | 'museum' | 'stool' | 'reset' | 'gate' | 'roster' | 'none';
export const CAST: readonly (readonly [id: string, code: string, role: CastRole])[] = [
  ['tom-nook', 'rco', 'roster'], ['isabelle', 'sza', 'roster'], ['timmy', 'rcm', 'shop'], ['tommy', 'rct', 'shop'], ['blathers', 'owl', 'museum'],
  ['kk-slider', 'tkkA', 'stool'], ['daisy-mae', 'boc', 'visit'], ['wisp', 'gstA', 'visit'], ['gulliver', 'gul', 'visit'], ['kicks', 'skk', 'visit'],
  ['label', 'hgc', 'visit'], ['saharah', 'cml', 'visit'], ['leif', 'slo', 'visit'], ['redd', 'fox', 'visit'], ['cj', 'bey', 'visit'], ['flick', 'chy', 'visit'],
  ['celeste', 'ows', 'visit'], ['jack', 'pkn', 'visit'], ['franklin', 'tuk', 'visit'], ['jingle', 'rei', 'visit'], ['zipper', 'pyn', 'visit'],
  ['reese', 'alw', 'visit'], ['cyrus', 'alp', 'visit'],
  ...GUESTS.map((g) => [g, CODES[g], 'guest'] as const), ['pave', 'pck', 'guest'],
  ['resetti', 'mol', 'reset'], ['booker', 'dgb', 'gate'], ['copper', 'dga', 'gate'],
  ['mabel', 'hgh', 'roster'], ['sable', 'hgs', 'roster'], ['brewster', 'pge', 'roster'], ['harvey', 'spn', 'roster'], ['kappn', 'kpp', 'roster'],
  ['pascal', 'seo', 'roster'], ['orville', 'dod', 'roster'], ['wilbur', 'doc', 'roster'],
  ['blanca', 'mka', 'none'], ['digby', 'szo', 'none'], ['don', 'mob', 'none'], ['grams', 'kpg', 'none'], ['harriet', 'poo', 'none'], ['joan', 'boa', 'none'],
  ['katie', 'lom', 'none'], ['leila', 'kps', 'none'], ['luna', 'tap', 'none'], ['lyle', 'ott', 'none'], ['niko', 'mnc', 'none'], ['pelly', 'plk', 'none'],
  ['phyllis', 'plm', 'none'], ['porter', 'mnk', 'none']
];
