// The shared ずかん (docs/design.md "Zukan"): the first find of each fish, bug, fossil, shell and star fragment across
// everyone (the two of us and the guest, NH's shared museum: each entry credited to its first finder), from the `find`
// events. Pure; read only by the ずかん and the island (to send a find once). The economy
// never imports this (deps.test.ts): a find is worth no ベル.
import type { LocalDate, Who } from '#lib/types.ts';
import type { FindKind } from '#lib/contract/api.ts';
import { localDateAt } from '#lib/time/dates.ts';
import type { State } from './state.ts';

export interface FirstFind {
  /** The Tokyo date of the first find. */
  date: LocalDate;
  at: number;
  /** Who found it first (`G`: the guest). */
  person: Who;
}

/** `kind:id`, the key of a find. */
export const findKey = (kind: FindKind, id: string): string => `${kind}:${id}`;

const memo = new WeakMap<State['finds'], Map<string, FirstFind>>();

/** The first find of each `kind:id` (findKey) by anyone, as of `t` (default: all): the earliest `at`, a tie to the
 *  fixed order (A, then B, then the guest). Memoised per list. */
export function findsView(s: Pick<State, 'finds'>, t = Infinity): Map<string, FirstFind> {
  const cached = t === Infinity ? memo.get(s.finds) : undefined;
  if (cached) return cached;
  const out = new Map<string, FirstFind>();
  for (const f of s.finds) {
    if (f.at > t) continue;
    const k = findKey(f.kind, f.id);
    const prev = out.get(k);
    if (!prev || f.at < prev.at || (f.at === prev.at && f.person < prev.person)) out.set(k, { date: localDateAt(f.at), at: f.at, person: f.person });
  }
  if (t === Infinity) memo.set(s.finds, out);
  return out;
}
