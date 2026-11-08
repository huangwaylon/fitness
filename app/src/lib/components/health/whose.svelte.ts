import type { Who } from '#lib/types.ts';

/** Whose data (健康) and whose day (ごはん): one pick for both tabs, kept for the session (docs/design.md "Kenkou").
 *  `who` null: this phone's person. `member`: the last member picked, what 健康 shows while the guest is picked (it has
 *  no guest data; its pill says so). */
export const whose = $state<{ who: Who | null; member: 'A' | 'B' | null }>({ who: null, member: null });

export function pickWhose(w: Who): void {
  whose.who = w;
  if (w !== 'G') whose.member = w;
}
