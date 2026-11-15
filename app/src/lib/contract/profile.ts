// A person's profile (せってい → プロフィール, docs/design.md "Profile"; docs/backend.md "Events" `pref`): their sex and
// birth date, prefs on the record. Locked (2026-11-15): the record refuses every profile pref from anyone
// (relay/src/store.ts `profile locked`), so a change takes a code change; these are the rules the rows already kept are
// read by, shared by the record (contract/record.ts prefTaken) and the model (model/state.ts). Private: a member's are
// the two members' alone and the guest's the guest's alone (contract/guest.ts profileSeen). Pure, relative imports only
// (the relay imports it).
import { isLocalDate } from './api.ts';

/** The profile's `pref` keys the model reads: `sex` (`m` · `f`) and `birth` (`YYYY-MM-DD`); an old row's null cleared it. */
export const PROFILE_KEYS = ['sex', 'birth'] as const;
export type ProfileKey = (typeof PROFILE_KEYS)[number];
export const isProfileKey = (k: unknown): k is ProfileKey => (PROFILE_KEYS as readonly unknown[]).includes(k);

/** `m` male, `f` female (for the formulas: Mifflin–St Jeor, the salt and protein references). */
export type Sex = 'm' | 'f';
export const isSex = (v: unknown): v is Sex => v === 'm' || v === 'f';

/** A birth date: a real date from 1900-01-01. */
export const isBirth = (v: unknown): v is string => isLocalDate(v) && v >= '1900-01-01';
