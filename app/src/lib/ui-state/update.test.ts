import { describe, expect, it, vi } from 'vitest';
import { COMPAT } from '#lib/contract/compat.ts';
import { AWAY_MS, doneFor, FRESH_MS, freshUntil, incompatible, inUse, markDone, noteHidden, takeUpdate, typingIn, type InHand, type UpdateState } from './update.ts';
import { claimed, watchClaims } from './claims.ts';

const s = (o: Partial<UpdateState>): UpdateState => ({ updated: true, ready: true, incompatible: false, busy: false, hidden: false, fresh: false, ...o });

describe('when a deployed build is taken (update.ts)', () => {
  it('an ordinary deploy: only in a fresh return (back after a while away, untouched), its worker in, nothing in hand', () => {
    expect(takeUpdate(s({}))).toBe(false);
    expect(takeUpdate(s({ hidden: true })), 'never as the app hides: a quick switch came back to a reloaded app').toBe(false);
    expect(takeUpdate(s({ fresh: true }))).toBe(true);
    expect(takeUpdate(s({ fresh: true, busy: true })), 'something in hand: kept for the next return or launch').toBe(false);
    expect(takeUpdate(s({ fresh: true, ready: false })), 'before its worker: the old shell again').toBe(false);
    expect(takeUpdate(s({ fresh: true, updated: false }))).toBe(false);
  });
  it('a build this one can\'t work with (or a chunk lost): as it hides too, never in front, never with something in hand', () => {
    expect(takeUpdate(s({ incompatible: true }))).toBe(false);
    expect(takeUpdate(s({ incompatible: true, hidden: true }))).toBe(true);
    expect(takeUpdate(s({ incompatible: true, hidden: true, busy: true }))).toBe(false);
    expect(takeUpdate(s({ incompatible: true, hidden: true, ready: false }))).toBe(false);
  });
  it('a return is fresh only after AWAY_MS hidden, for FRESH_MS (freshUntil, noteHidden)', () => {
    const m = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) });
    try {
      expect(freshUntil(1_000_000), 'never hidden (a launch)').toBe(0);
      noteHidden(1_000_000);
      expect(freshUntil(1_000_000 + AWAY_MS - 1), 'a quick switch away').toBe(0);
      noteHidden(1_000_000);
      expect(freshUntil(1_000_000 + AWAY_MS)).toBe(1_000_000 + AWAY_MS + FRESH_MS);
      expect(freshUntil(1_000_000 + AWAY_MS + 1), 'once a hide').toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('in hand: a sheet, a page but the island and the tent, a hike, a keyboard, unsent rows', () => {
    const h = (o: Partial<InHand>): InHand => ({ open: false, route: '/', hike: false, typing: false, queued: 0, ...o });
    expect(inUse(h({}))).toBe(false);
    expect(inUse(h({ route: '/tent' }))).toBe(false);
    for (const o of [{ open: true }, { route: '/sugoroku' }, { route: '/shop' }, { hike: true }, { typing: true }, { queued: 1 }]) expect(inUse(h(o)), JSON.stringify(o)).toBe(true);
    const el = (tag: string, type = '', editable = false) => ({ tagName: tag, type, isContentEditable: editable }) as unknown as Element;
    expect(typingIn(null)).toBe(false);
    expect(typingIn(el('INPUT', 'text'))).toBe(true);
    expect(typingIn(el('INPUT', 'search'))).toBe(true);
    expect(typingIn(el('INPUT', 'checkbox'))).toBe(false);
    expect(typingIn(el('TEXTAREA'))).toBe(true);
    expect(typingIn(el('DIV', '', true))).toBe(true);
    expect(typingIn(el('BUTTON'))).toBe(false);
  });
  it('incompatible: version.json\'s compat past this build\'s; none or not a number is compatible', () => {
    expect(incompatible(COMPAT + 1)).toBe(true);
    expect(incompatible(COMPAT)).toBe(false);
    expect(incompatible(COMPAT - 1)).toBe(false);
    expect(incompatible(undefined)).toBe(false);
    expect(incompatible('9')).toBe(false);
  });
});

describe('the reloads\' guards and the claims (update.ts)', () => {
  it('one reload a deployed version a session (doneFor / markDone)', () => {
    const m = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
    try {
      expect(doneFor('island.updateFor', 'v2')).toBe(false);
      markDone('island.updateFor', 'v2');
      expect(doneFor('island.updateFor', 'v2')).toBe(true);
      expect(doneFor('island.updateFor', 'v3')).toBe(false);
      expect(doneFor('island.staleFor', 'v2')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('a newer worker\'s claim asks Kit at once, from the start; one before Kit can is counted for the layout\'s mount', () => {
    const sw = new EventTarget() as unknown as ServiceWorkerContainer;
    const check = vi.fn(() => Promise.resolve(true));
    watchClaims(check, sw);
    const before = claimed();
    sw.dispatchEvent(new Event('controllerchange'));
    expect(check).toHaveBeenCalledTimes(1);
    const early = vi.fn(() => {
      throw new Error('Kit not started');
    });
    watchClaims(early, sw);
    expect(() => sw.dispatchEvent(new Event('controllerchange'))).not.toThrow();
    expect(claimed()).toBe(before + 3);
  });
});
