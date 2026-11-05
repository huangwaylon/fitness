// A person's profile (せってい → プロフィール, docs/design.md "Profile"; docs/backend.md "Events" `pref`): their sex, their
// birth date and the BMI standard their category is read by, prefs like the goals. What the record accepts, shared by
// the record (contract/record.ts validEventData) and the model (model/state.ts). Private: a member's are the two members'
// alone and the guest's the guest's alone (contract/guest.ts profileSeen). Pure, relative imports only (the relay
// imports it).
import { isLocalDate } from './api.ts';

/** The profile's `pref` keys: `sex` (SEXES), `birth` (`YYYY-MM-DD`) and `bmiStd` (BMI_STDS). Each may be cleared (null). */
export const PROFILE_KEYS = ['sex', 'birth', 'bmiStd'] as const;
export type ProfileKey = (typeof PROFILE_KEYS)[number];
export const isProfileKey = (k: unknown): k is ProfileKey => (PROFILE_KEYS as readonly unknown[]).includes(k);

/** `m` male, `f` female (for the formulas: Mifflin–St Jeor, the salt and protein references). Unset: ひみつ. */
export const SEXES = ['m', 'f'] as const;
export type Sex = (typeof SEXES)[number];
export const isSex = (v: unknown): v is Sex => v === 'm' || v === 'f';

/** The BMI category's thresholds: `asia` (JASSO / WHO's Asian cut-offs: 23 and 25) or `who` (25 and 30). */
export const BMI_STDS = ['asia', 'who'] as const;
export type BmiStd = (typeof BMI_STDS)[number];
export const isBmiStd = (v: unknown): v is BmiStd => v === 'asia' || v === 'who';

/** A birth date's range: from 1900-01-01 to `BIRTH.minAge` years before the day it's set. */
export const BIRTH = { from: '1900-01-01', minAge: 10 } as const;

/** The latest birth date allowed on `today` (`YYYY-MM-DD`): `BIRTH.minAge` years before (a 29 Feb's year before: 28 Feb). */
export function latestBirth(today: string): string {
  const y = String(+today.slice(0, 4) - BIRTH.minAge).padStart(4, '0');
  const md = today.slice(5);
  return md === '02-29' ? `${y}-02-28` : `${y}-${md}`;
}

/** A birth date that may be set on `today`: a real date in BIRTH's range. */
export const isBirth = (v: unknown, today: string): v is string => isLocalDate(v) && v >= BIRTH.from && v <= latestBirth(today);

/** Whether a profile pref's value may be set on `today`: its key's value, or null to clear it. */
export function profileValueOk(key: ProfileKey, v: unknown, today: string): boolean {
  if (v === null) return true;
  return key === 'sex' ? isSex(v) : key === 'birth' ? isBirth(v, today) : isBmiStd(v);
}
