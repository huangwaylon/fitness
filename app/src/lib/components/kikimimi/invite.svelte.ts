// ききみみ クイズ's always-loaded part (docs/kikimimi.md "UI"): whether the game's sheet is open, and a tiny listener
// on the island's shared Live (IslandScene's `relay ?? demoRelay`: never a second one). It keeps the game intents heard
// lately (either wire: `quiz`, and `play` from 8c, docs/kikimimi-framework.md §4.3), so a sheet opened later (さんか on
// the banner, せってい's あそぶ) hands them to its session as if it had heard
// them itself (a host re-sends only when someone comes back), calls `invited` for a new lobby someone here opened, and
// keeps whether an invite is live (せってい's row: 「さそわれています！」). Nothing of the game itself (the bank, the
// deck, the session) is imported here: they come with the sheet's chunk.
import type { Live } from '#lib/sync/live.ts';
import type { Who } from '#lib/contract/live-protocol.ts';
import type { GameIn } from '#lib/kikimimi/round/wire.ts';
import { voiceSession } from '#lib/sound/sound.svelte.ts';

/** The sheet: mounted from its first opening, open, and the game it opens joined (the banner's さんか). */
export const quiz = $state<{ mounted: boolean; open: boolean; join: string | null }>({ mounted: false, open: false, join: null });

/** What's kept of the heard: the last this many, none older than a lobby lives (round/session.ts WINDOWS.openTtl). */
const KEEP = 120;
const KEEP_MS = 600_000;
/** A game going is still an invite while its host is heard (its beacon is every 3 s: round/session.ts WINDOWS.beacon). */
const GOING_MS = 15_000;
let heard: { m: GameIn; at: number }[] = [];
let link: Live | null = null;

/** The latest invite heard: its game, host, when it opened, whether it started and when its host was last heard
 *  (dropped as it goes stale, so the marks on the menu go with it). */
const invite = $state<{ v: { g: string; host: Who; opened: number; started: boolean; last: number } | null }>({ v: null });
let expiry: ReturnType<typeof setTimeout> | undefined;
function arm() {
  clearTimeout(expiry);
  const v = invite.v;
  if (!v) return;
  const until = v.started ? v.last + GOING_MS : v.opened + KEEP_MS;
  expiry = setTimeout(() => (invitedNow() ? arm() : (invite.v = null)), Math.max(0, until - Date.now()) + 50);
}

/** The game intents heard lately, oldest first (the sheet's session takes them as it starts). */
export function heardQuiz(now = Date.now()): GameIn[] {
  heard = heard.filter((h) => now - h.at < KEEP_MS);
  return heard.map((h) => h.m);
}

/** Someone's invite is live (a lobby of theirs open, or its game going): the menu's ききとり pill and leaf say so. */
export function invitedNow(now = Date.now()): boolean {
  const v = invite.v;
  return !!v && (v.started ? now - v.last < GOING_MS : now - v.opened < KEEP_MS);
}

/** The live invite's game and host (the hub's card while my own lobby is open), or null. Reactive. */
export function liveInvite(): { g: string; host: Who } | null {
  const v = invite.v;
  return v && invitedNow() ? { g: v.g, host: v.host } : null;
}

/** The island's Live, for the sheet (null: no relay, a solo game). */
export const quizLive = (): Live | null => link;

/** The menu pill's tap: the voice session must begin inside the tap itself (iOS). */
export const wakeQuizVoice = (): void => void voiceSession(true);

/** Open the sheet (**inside a tap**, or after wakeQuizVoice in one: the voice session starts here, so the clips can
 *  play with the silent switch on); `join` a game heard of (the banner's さんか). */
export function openQuiz(join: string | null = null): void {
  voiceSession(true);
  quiz.join = join;
  quiz.mounted = true;
  quiz.open = true;
}

/** Listen on the island's Live: keep what's heard, and call `invited(host, g)` once for each new lobby another opened
 *  while the sheet is closed (a host's re-send as I come: the lobby's news to me too), `ended(g)` when its host
 *  cancels or leaves it. Returns the stop. */
export function listenQuiz(live: Live | null, invited: (host: Who, g: string) => void, ended: (g: string) => void): () => void {
  link = live;
  if (!live) return () => {};
  const asked = new Map<string, Who>();
  const off = live.on((m) => {
    if ((m.kind !== 'quiz' && m.kind !== 'play') || m.op === 'ev') return;
    const at = Date.now();
    heard.push({ m, at });
    if (heard.length > KEEP) heard = heard.slice(-KEEP);
    const v = invite.v;
    if (m.op === 'open') {
      if (v?.g !== m.g) invite.v = { g: m.g, host: m.who, opened: at, started: false, last: at };
    } else if (v?.g === m.g && m.who === v.host) {
      if (m.op === 'end' || m.op === 'leave') invite.v = null;
      else invite.v = { ...v, started: v.started || m.op === 'go' || m.op === 'skip', last: at };
    }
    arm();
    if (m.op === 'open' && !asked.has(m.g) && !quiz.open) {
      asked.set(m.g, m.who);
      invited(m.who, m.g);
    } else if ((m.op === 'end' || m.op === 'leave') && asked.get(m.g) === m.who) ended(m.g);
  });
  return () => {
    off();
    if (link === live) link = null;
  };
}
