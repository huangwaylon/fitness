// A person's look (design/avatar/customization.md §4; docs/backend.md "Events" `pref`): an NH human player assembled
// from parts, or their roster villager (the `villager` pref says which). Two prefs, each the sender's own (members and
// the guest alike, never another's): `look` (the look worn, or null for いつもの) and `savedLooks` (their コーデ, the
// whole list). いつもの, the default look, is code (DEFAULT_LOOKS), never stored: no `look` pref means it. What the record
// accepts (contract/record.ts validEventData: lookPrefOk, savedLooksOk) and how a phone reads it (resolveLook,
// readSavedLooks: an unknown or broken part reads as the default look's, never a crash). Pure, relative imports only
// (the relay imports it).
import { isRec } from './api.ts';
import type { Who } from '../types.ts';

/** A part id: a dump folder name, e.g. `PlayerHair24`, `TopsTexTopOuterLAran3` (the part table's ids). */
export type PartId = string;
/** A colour, `#rrggbb`. @public */
export type Hex = string;
/** 0, 1 or 2: the cheek's blush shape (0 hard oval, 1 soft, 2 none) or the nose (Nose00 triangle, 01 dot, 02 square).
 *  @public */
export type Shape3 = 0 | 1 | 2;

/** A human player's look, version 1. Colours are tints (no bytes); every part is a part id of its slot. */
export interface PlayerLook {
  v: 1;
  hair: PartId; hairColor: Hex;
  eye: PartId; eyeColor: Hex;
  /** The mouth and its resting frame (0–8: 0 gentle smile, 1 open smile, …; design/avatar/tech-notes.md). */
  mouth: PartId; mouthFrame: number;
  skin: Hex; cheek: Shape3; nose: Shape3;
  /** A top (`TopsTexTop…`) or a one-piece (`TopsTexOnepiece…`: then `bottom` is null). */
  top: PartId | null;
  bottom: PartId | null;
  socks: PartId | null;
  shoes: PartId | null;
  glasses: PartId | null;
  /** A hair ornament (`CapOrnament…`), with or without glasses. */
  ornament: PartId | null;
  /** A hat (`CapHat…`): later (only some hairstyles have a cap version). Absent = none. */
  hat?: PartId | null;
}

/** The `look` pref's value: a player, or the roster villager (`villager` pref). null (or none) = いつもの. */
export type LookPref = { kind: 'player'; look: PlayerLook } | { kind: 'villager' };
/** The look to draw (resolveLook): a player's parts, or a villager (`villager`: the roster id, null = the person's
 *  default villager, lib/villagers/look.ts resolveLook). */
export type Look = ({ kind: 'player' } & PlayerLook) | { kind: 'villager'; villager: string | null };

/** A saved look (コーデ): an 8-character id, a name of 1–12 characters (trimmed, plain text) and a player's look. */
export interface SavedLook { id: string; name: string; look: PlayerLook }

/** The garment and face slots, each id's required prefix (the dump's folder families). @public (the closet, the 3D
 *  player) */
export const PART_SLOTS = {
  hair: 'PlayerHair', eye: 'PlayerEye', mouth: 'PlayerMouth',
  top: 'TopsTex', bottom: 'BottomsTex', socks: 'SocksTex', shoes: 'Shoes',
  glasses: 'AccessoryGlass', ornament: 'CapOrnament', hat: 'CapHat'
} as const;
export type PartSlot = keyof typeof PART_SLOTS;
/** The slots that may be empty (null). */
const OPTIONAL_SLOTS = ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const satisfies readonly PartSlot[];
const REQUIRED_SLOTS = ['hair', 'eye', 'mouth'] as const satisfies readonly PartSlot[];
const COLOURS = ['hairColor', 'eyeColor', 'skin'] as const;

export const LOOK_LIMITS = {
  /** コーデ per person (いつもの not counted: it's never stored). */
  saved: 20,
  nameMaxChars: 12,
  /** A part id's length at most (the longest in the dump is under 32). */
  partMaxChars: 40,
  mouthFrames: 9
} as const;

/** A part id's form: letters and digits, starting with a capital (its slot's prefix: partOk). */
const PART_RE = /^[A-Z][A-Za-z0-9]*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const SAVED_ID_RE = /^[a-z0-9]{8}$/;

/**
 * The part table (generated from the QA'd shapes by the closet pipeline: not yet). Until one is set every well-formed
 * id of its slot passes; once set (usePartTable), only its ids do: the record refuses the rest, a phone reads them as the
 * default look's part. A `Set<string>` of ids fits.
 */
export interface PartTable { has(id: string): boolean }
let partTable: PartTable | null = null;
/** Set (or clear, null) the part table every check here consults. @public (the closet pipeline's table, coming) */
export function usePartTable(t: PartTable | null): void {
  partTable = t;
}

/** Whether `id` is a part of `slot`: its prefix, well-formed, at most LOOK_LIMITS.partMaxChars, in the table if set. */
export function partOk(slot: PartSlot, id: unknown): id is PartId {
  return typeof id === 'string' && id.length <= LOOK_LIMITS.partMaxChars && id.length > PART_SLOTS[slot].length
    && id.startsWith(PART_SLOTS[slot]) && PART_RE.test(id) && (partTable === null || partTable.has(id));
}
/** @public (the すがた level's colour fields) */
export const isHex = (v: unknown): v is Hex => typeof v === 'string' && HEX_RE.test(v);
const isShape3 = (v: unknown): v is Shape3 => v === 0 || v === 1 || v === 2;
const isMouthFrame = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < LOOK_LIMITS.mouthFrames;
/** A one-piece (a dress: it clears the bottoms). @public (the closet's wear rules) */
export const isOnepiece = (top: PartId | null | undefined): boolean => typeof top === 'string' && top.startsWith('TopsTexOnepiece');

const PLAYER_KEYS: ReadonlySet<string> = new Set(['v', ...REQUIRED_SLOTS, ...OPTIONAL_SLOTS, ...COLOURS, 'mouthFrame', 'cheek', 'nose']);

/** Whether `v` is a whole, valid PlayerLook (the record's check): every field, no other key, a one-piece with no bottom. */
export function isPlayerLook(v: unknown): v is PlayerLook {
  if (!isRec(v) || v.v !== 1 || Object.keys(v).some((k) => !PLAYER_KEYS.has(k))) return false;
  return REQUIRED_SLOTS.every((s) => partOk(s, v[s]))
    && OPTIONAL_SLOTS.every((s) => (s === 'hat' && v.hat === undefined) || v[s] === null || partOk(s, v[s]))
    && COLOURS.every((c) => isHex(v[c]))
    && isMouthFrame(v.mouthFrame) && isShape3(v.cheek) && isShape3(v.nose)
    && !(isOnepiece(v.top as PartId | null) && v.bottom !== null);
}

/** Whether the record takes this `look` pref value: null (いつもの), `{kind:'villager'}` or `{kind:'player', look}`. */
export function lookPrefOk(v: unknown): v is LookPref | null {
  if (v === null) return true;
  if (!isRec(v)) return false;
  const keys = Object.keys(v);
  if (v.kind === 'villager') return keys.length === 1;
  return v.kind === 'player' && keys.length === 2 && isPlayerLook(v.look);
}

/** Whether a phone reads this `look` pref value (the model's and the slot's rule, contract/record.ts prefTaken): null, a
 *  villager, or a player with any look (read part by part: resolveLook). The record's own check is lookPrefOk. */
export const lookPrefRead = (v: unknown): boolean =>
  v === null || (isRec(v) && (v.kind === 'villager' || (v.kind === 'player' && isRec(v.look))));

/** A コーデ's name as kept: trimmed; null when empty, longer than LOOK_LIMITS.nameMaxChars characters (code points) or
 *  holding a control character (a line break). */
export function lookName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const n = v.trim();
  return n.length >= 1 && [...n].length <= LOOK_LIMITS.nameMaxChars && !/\p{Cc}/u.test(n) ? n : null;
}

const isSavedLook = (v: unknown): v is SavedLook =>
  isRec(v) && Object.keys(v).length === 3 && typeof v.id === 'string' && SAVED_ID_RE.test(v.id)
  && lookName(v.name) === v.name && isPlayerLook(v.look);

/** Whether the record takes this `savedLooks` pref value: at most LOOK_LIMITS.saved コーデ, each whole, ids unique. */
export function savedLooksOk(v: unknown): v is SavedLook[] {
  return Array.isArray(v) && v.length <= LOOK_LIMITS.saved && v.every(isSavedLook) && new Set(v.map((s) => s.id)).size === v.length;
}

/**
 * いつもの per person: A's and B's the signed-off players (design/avatar/render/outfits/a.json, b.json: look.test.ts
 * checks they agree); the guest's its villager (it isn't changed under it). Code, never stored.
 */
export const DEFAULT_LOOKS: Record<'A' | 'B', PlayerLook> = {
  A: {
    v: 1, hair: 'PlayerHair24', hairColor: '#2f241d', eye: 'PlayerEye02', eyeColor: '#3d2416', mouth: 'PlayerMouth01', mouthFrame: 0,
    skin: '#f6cfa8', cheek: 1, nose: 0,
    top: 'TopsTexTopOuterLAran3', bottom: 'BottomsTexPantsNormalSlacks0', socks: 'SocksTexDailysocks1', shoes: 'ShoesLowcutRubbertoe7',
    glasses: 'AccessoryGlassCircle0', ornament: null
  },
  B: {
    v: 1, hair: 'PlayerHair12', hairColor: '#2f241d', eye: 'PlayerEye22', eyeColor: '#3d2416', mouth: 'PlayerMouth01', mouthFrame: 1,
    skin: '#f6cfa8', cheek: 1, nose: 0,
    top: 'TopsTexTopYshirtsHPolo7', bottom: 'BottomsTexSkirtLongDenim3', socks: 'SocksTexDailysocks1', shoes: 'ShoesLowcutRubbertoe7',
    glasses: null, ornament: 'CapOrnamentLRibbon7'
  }
};

/** The player look a person starts from: theirs (A, B), or A's for the guest (who wears its villager until it picks). */
const basePlayerLook = (person: Who): PlayerLook => DEFAULT_LOOKS[person === 'G' ? 'A' : person];

/** いつもの: the look `person` wears with no `look` pref. */
export const defaultLook = (person: Who): Look =>
  person === 'G' ? { kind: 'villager', villager: null } : { kind: 'player', ...DEFAULT_LOOKS[person] };

/**
 * A player's look as a phone draws it: every field that's missing, broken or names a part it doesn't know (a newer
 * app's, one the table dropped) is `base`'s, so it never fails; a one-piece clears the bottoms. Never throws.
 */
export function readPlayerLook(v: unknown, base: PlayerLook): PlayerLook {
  if (!isRec(v)) return { ...base };
  const out: PlayerLook = { ...base };
  for (const s of REQUIRED_SLOTS) if (partOk(s, v[s])) out[s] = v[s];
  for (const s of OPTIONAL_SLOTS) if (v[s] === null || partOk(s, v[s])) out[s] = v[s] as PartId | null;
  for (const c of COLOURS) if (isHex(v[c])) out[c] = v[c];
  if (isMouthFrame(v.mouthFrame)) out.mouthFrame = v.mouthFrame;
  if (isShape3(v.cheek)) out.cheek = v.cheek;
  if (isShape3(v.nose)) out.nose = v.nose;
  if (out.hat === undefined) delete out.hat;
  if (isOnepiece(out.top)) out.bottom = null;
  return out;
}

/** The prefs resolveLook reads (model/state.ts Prefs). */
export interface LookPrefs { look?: unknown; villager?: string | null }

/**
 * The look `person` wears: their `look` pref read leniently (readPlayerLook), a villager with their `villager` pref,
 * or いつもの (defaultLook) when unset or unreadable.
 */
export function resolveLook(prefs: LookPrefs | null | undefined, person: Who): Look {
  const p = prefs?.look;
  if (isRec(p) && p.kind === 'villager') return { kind: 'villager', villager: prefs?.villager ?? null };
  if (isRec(p) && p.kind === 'player' && isRec(p.look)) return { kind: 'player', ...readPlayerLook(p.look, basePlayerLook(person)) };
  return defaultLook(person);
}

/** A person's コーデ as a phone shows them: the readable ones (each look read as readPlayerLook), at most
 *  LOOK_LIMITS.saved, ids unique. Never throws. */
export function readSavedLooks(v: unknown, person: Who): SavedLook[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: SavedLook[] = [];
  for (const s of v) {
    if (out.length >= LOOK_LIMITS.saved) break;
    if (!isRec(s) || typeof s.id !== 'string' || !SAVED_ID_RE.test(s.id) || seen.has(s.id)) continue;
    const name = lookName(s.name);
    if (name === null || !isRec(s.look)) continue;
    seen.add(s.id);
    out.push({ id: s.id, name, look: readPlayerLook(s.look, basePlayerLook(person)) });
  }
  return out;
}

/** The player look of a Look (to edit from, or save): a villager's is `person`'s いつもの player (A's for the guest).
 *  @public (the すがた level) */
export const playerOf = (l: Look, person: Who): PlayerLook => {
  if (l.kind === 'villager') return { ...basePlayerLook(person) };
  const { kind: _kind, ...look } = l;
  return look;
};

/** Whether two player looks are the same (the コーデ being worn: its chip's ⋯). */
export function sameLook(a: PlayerLook, b: PlayerLook): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof PlayerLook>;
  return [...keys].every((k) => (a[k] ?? null) === (b[k] ?? null));
}

/** A new コーデ id: 8 lowercase letters and digits. */
export function newLookId(rand: () => number = Math.random): string {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += abc[Math.floor(rand() * abc.length)];
  return s;
}
