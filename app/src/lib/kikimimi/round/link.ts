// A round session wired to the island's Live (docs/kikimimi.md "Sync"; IslandScene's `relay ?? demoRelay`, never a
// second one): the game intents heard on either wire (round/wire.ts) and who's here go in, the session's ops go out on
// the wire (`quiz` in 8b), `changed` after each.
import type { Live } from '../../sync/live.ts';
import type { Who } from '../../contract/live-protocol.ts';
import { gameIn, isGameIn, toWire, type RoundIn, type RoundOut } from './wire.ts';

/** What a session needs of the island's Live. */
export interface RoundLink {
  /** The relay's clock. */
  now(): number;
  send(m: RoundOut): boolean;
  /** Game ops heard (either wire). */
  on(fn: (m: RoundIn) => void): () => void;
  /** Who else is here (called at once; null while this phone's own socket is down). */
  onHere(fn: (here: readonly Who[] | null) => void): () => void;
}

/** A Live as a RoundLink. */
export function roundLink(live: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'>): RoundLink {
  return {
    now: () => live.serverNow(),
    send: (m) => {
      const w = toWire(m);
      return !!w && live.send(w);
    },
    on: (fn) =>
      live.on((m) => {
        const r = isGameIn(m) ? gameIn(m) : null;
        if (r) fn(r);
      }),
    onHere: (fn) => {
      let was = '';
      return live.onStatus((st) => {
        const key = st.connected ? st.here.join() : '-';
        if (key === was) return;
        was = key;
        fn(st.connected ? st.here : null);
      });
    }
  };
}

/** No relay (a dev build without one): a game alone, on the device's clock. */
export const soloLink = (): RoundLink => ({ now: () => Date.now(), send: () => false, on: () => () => {}, onHere: (fn) => (fn([]), () => {}) });

/** What `wire` drives: a session's ops in and out. */
export interface Wired {
  receive(m: RoundIn, now: number): RoundOut[];
  presence(here: readonly Who[] | null, now: number): RoundOut[];
  tick(now: number): RoundOut[];
}

/** Wire a session to a link: what's heard and who's here go in (their outputs sent), `changed` after each. The UI's
 *  taps go through `act` (`act((s, now) => s.answer(k, rp, now))`); its wake-ups call `tick` (the host's beacon: sent,
 *  `changed` not called). */
export function wire<S extends Wired>(session: S, link: RoundLink, changed: () => void): { act(f: (s: S, now: number) => RoundOut[] | void): void; tick(): void; stop(): void } {
  const send = (out: RoundOut[] | void) => {
    for (const m of out ?? []) link.send(m);
    changed();
  };
  const offs = [link.on((m) => send(session.receive(m, link.now()))), link.onHere((here) => send(session.presence(here, link.now())))];
  return {
    act: (f) => send(f(session, link.now())),
    tick: () => {
      for (const m of session.tick(link.now())) link.send(m);
    },
    stop: () => {
      for (const off of offs) off();
    }
  };
}
