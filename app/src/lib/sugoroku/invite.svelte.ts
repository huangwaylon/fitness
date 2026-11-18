// 英語すごろく's invitation (docs/sugoroku.md "Online"): the banner's state, always loaded (ToastHost shows it on every
// screen, components/InviteBanner.svelte); online.svelte.ts decides it (online.ts invited). 参加 or ✕ answers it, by
// game id on this phone (DEVICE.sugorokuAnswered): never asked again.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { Who } from '#lib/types.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { closeSheets } from '#lib/ui-state/lazySheet.svelte.ts';

/** The game asking (its id), who started it, and the banner's words. */
export interface Invitation { g: string; who: Who; text: string; join: string }

export const invite = $state<{ cur: Invitation | null; answered: string[] }>({ cur: null, answered: [] });

/** The games answered on this phone, as kept. */
export function readAnswered(): string[] {
  const a = readJson<unknown>(localKV(), DEVICE.sugorokuAnswered);
  return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [];
}

/** ✕ (and 参加): this game's invitation gone for good on this phone. */
export function answer(g: string): void {
  invite.answered = [...invite.answered.filter((x) => x !== g), g].slice(-20);
  writeJson(localKV(), DEVICE.sugorokuAnswered, invite.answered);
  if (invite.cur?.g === g) invite.cur = null;
}

/** 参加: straight into the game's own screen (/sugoroku?m=online, the page's query kept: ?demo, the e2e's hooks), the
 *  island's sheets closed (none open again on the way back). */
export function join(): void {
  const g = invite.cur?.g;
  if (!g) return;
  answer(g);
  closeSheets();
  const q = new URLSearchParams(location.search);
  q.set('m', 'online');
  void goto(`${resolve('/sugoroku')}?${q}`);
}
