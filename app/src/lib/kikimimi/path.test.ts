import { describe, expect, it } from 'vitest';
import { landmarksOf, lessonsOfMask, matches, nextLesson, pathOf, type PathUnit } from './path.ts';
import type { UnitState } from './stamps.ts';

const u = (id: string, stage: string, domain: string, also?: string[]): PathUnit => ({
  id, name: id, stage, domain, host: 'diana', status: 'voiced', lessons: ['deai', 'bamen', 'check', 'oto'], ...(also && { also })
});
const st = (o: Partial<UnitState>): UnitState => ({ done: [], stamped: null, stampedIn: null, tally: null, partner: false, double: false, recheck: null, ...o });

const UNITS = [u('fr-replan', 'kawa', 'tomodachi'), u('wk-chat', 'mori', 'shigoto'), u('gl-clarify', 'kawa', 'glue'), u('tr-guide', 'mori', 'tabi', ['machi']),
  u('ev-bday', 'kawa', 'ibento'), u('zz-odd', 'moon', 'tabi')];

describe('しまの みち', () => {
  it('orders the stops by stage, the anchors first, then as given; a stage it doesn’t know is left out', () => {
    const p = pathOf({ units: UNITS, states: new Map(), level: 3 });
    expect(p.stages.map((s) => s.stage)).toEqual(['hama', 'kawa', 'mori', 'yama', 'hoshi']);
    expect(p.stages.map((s) => s.stars)).toEqual([1, 2, 3, 4, 5]);
    expect(p.stages[1].stops.map((s) => s.id)).toEqual(['gl-clarify', 'fr-replan', 'ev-bday']);
    expect(p.stages[1].stops[0].anchor).toBe(true);
    expect(p.stages[2].stops.map((s) => s.id)).toEqual(['wk-chat', 'tr-guide']);
    expect(p.stages.flatMap((s) => s.stops).some((s) => s.id === 'zz-odd')).toBe(false);
  });

  it('the current unit: the last one I played that isn’t stamped, else the first open one from my stage up', () => {
    // no data: from はまべ 2's level, かわ's anchor first
    expect(pathOf({ units: UNITS, states: new Map(), level: null }).current).toBe('gl-clarify');
    // comfortable at もり: its first
    expect(pathOf({ units: UNITS, states: new Map(), level: 4 }).current).toBe('wk-chat');
    // played last (unstamped) wins, wherever it is
    const states = new Map([['fr-replan', st({ done: ['deai'] })], ['ev-bday', st({ done: ['deai', 'bamen', 'check'], stamped: '2026-11-01' })]]);
    expect(pathOf({ units: UNITS, states, level: 4, played: ['fr-replan', 'ev-bday'] }).current).toBe('fr-replan');
    // everything above stamped: the first open one anywhere
    const all = new Map(['wk-chat', 'tr-guide'].map((id) => [id, st({ stamped: '2026-11-01' })]));
    expect(pathOf({ units: UNITS, states: all, level: 4 }).current).toBe('gl-clarify');
    const p = pathOf({ units: UNITS, states, level: 4, played: ['fr-replan'] });
    expect(p.stages.flatMap((s) => s.stops).filter((s) => s.current).map((s) => s.id)).toEqual(['fr-replan']);
    expect(p.stages[1].stamped).toBe(1);
    // nothing open: none
    const done = new Map(UNITS.map((x) => [x.id, st({ stamped: '2026-11-01' })]));
    expect(pathOf({ units: UNITS, states: done, level: 3 }).current).toBeNull();
    expect(pathOf({ units: [], states: new Map(), level: 3 }).current).toBeNull();
  });

  it('filters by domain: other domains collapse (never removed), the anchors and a unit’s also stay', () => {
    const p = pathOf({ units: UNITS, states: new Map(), level: 3, filter: 'machi' });
    const shown = p.stages.flatMap((s) => s.stops).filter((s) => !s.hidden).map((s) => s.id);
    expect(shown).toEqual(['gl-clarify', 'tr-guide']);
    expect(p.stages.flatMap((s) => s.stops)).toHaveLength(5);
    // the current unit stays the current one under a filter
    expect(p.current).toBe('gl-clarify');
    expect(p.chips).toEqual(['tomodachi', 'tabi', 'shigoto', 'ibento', 'machi']);
    expect(matches({ domain: 'tabi' }, 'all')).toBe(true);
    expect(matches({ domain: 'tabi' }, 'shigoto')).toBe(false);
  });

  it('a stage far above my level is soft, still with its stops', () => {
    const p = pathOf({ units: UNITS, states: new Map(), level: 2.5 });
    expect(p.stages.map((s) => s.soft)).toEqual([false, false, true, true, true]);
    expect(p.stages[2].stops).toHaveLength(2);
    expect(pathOf({ units: UNITS, states: new Map(), level: 4 }).stages.map((s) => s.soft)).toEqual([false, false, false, false, true]);
  });

  it('with a placement: every stage above the placed one is soft, it is 「ここから」, the current unit’s stage open', () => {
    // placed at かわ: もり soft (only a step up, but above the placement), かわ here and open
    const p = pathOf({ units: UNITS, states: new Map(), level: 4, placed: 3 });
    expect(p.stages.map((s) => s.soft)).toEqual([false, false, true, true, true]);
    expect(p.here).toBe('kawa');
    expect(p.current).toBe('gl-clarify');
    expect(p.open).toBe('kawa');
    // placed at もり: from there; nothing soft below it
    const m = pathOf({ units: UNITS, states: new Map(), level: null, placed: 4 });
    expect([m.here, m.current, m.open]).toEqual(['mori', 'wk-chat', 'mori']);
    expect(m.stages.map((s) => s.soft)).toEqual([false, false, false, true, true]);
    // placed at はまべ (no units there): 「ここから」 on はまべ, the first unit above it open
    const h = pathOf({ units: UNITS, states: new Map(), level: null, placed: 2 });
    expect([h.here, h.current, h.open]).toEqual(['hama', 'gl-clarify', 'kawa']);
    // no check: no 「ここから」; the old rule (more than a step above my level)
    const n = pathOf({ units: UNITS, states: new Map(), level: 3 });
    expect(n.here).toBeNull();
    expect(n.open).toBe('kawa');
    // nothing open anywhere: the placed stage
    const done = new Map(UNITS.map((x) => [x.id, st({ stamped: '2026-11-01' })]));
    expect(pathOf({ units: UNITS, states: done, level: null, placed: 4 }).open).toBe('mori');
  });

  it('a landmark: a stage whose units are all stamped by me, one by one; never the placement, never the partner', () => {
    const kawa = ['gl-clarify', 'fr-replan', 'ev-bday'];
    const two = new Map(kawa.slice(0, 2).map((id) => [id, st({ stamped: '2026-11-02' })]));
    expect(landmarksOf(UNITS, two).size).toBe(0);
    const all = new Map([...two, ['ev-bday', st({ stamped: '2026-11-05' })]]);
    expect([...landmarksOf(UNITS, all)]).toEqual([['kawa', '2026-11-05']]);
    const p = pathOf({ units: UNITS, states: all, level: 4 });
    expect(p.stages.map((s) => s.cleared)).toEqual([null, '2026-11-05', null, null, null]);
    // placed above かわ (もり), nothing stamped: かわ is open to skip, never cleared; はまべ (no units) has none either
    const placed = pathOf({ units: UNITS, states: new Map(), level: null, placed: 4 });
    expect(placed.stages.map((s) => s.cleared)).toEqual([null, null, null, null, null]);
    // the partner's stamps alone (their summary's bit) don't clear it
    const theirs = new Map(kawa.map((id) => [id, st({ partner: true })]));
    expect(landmarksOf(UNITS, theirs).size).toBe(0);
    // a filter never changes it
    expect(pathOf({ units: UNITS, states: all, level: 4, filter: 'shigoto' }).stages[1].cleared).toBe('2026-11-05');
  });

  it('the next lesson: the core in order, the チェック till stamped, then an extra', () => {
    const ls = lessonsOfMask(31);
    expect(ls).toEqual(['deai', 'bamen', 'check', 'oto', 'jissen']);
    expect(lessonsOfMask(7)).toEqual(['deai', 'bamen', 'check']);
    expect(nextLesson(ls, undefined)).toBe('deai');
    expect(nextLesson(ls, st({ done: ['deai'] }))).toBe('bamen');
    expect(nextLesson(ls, st({ done: ['bamen'] }))).toBe('deai');
    expect(nextLesson(ls, st({ done: ['deai', 'bamen', 'check'] }))).toBe('check');
    // とばして チェック stamped it: the extras next, then the チェック again
    expect(nextLesson(ls, st({ done: ['check'], stamped: '2026-11-01' }))).toBe('oto');
    expect(nextLesson(ls, st({ done: ['check', 'oto', 'jissen'], stamped: '2026-11-01' }))).toBe('check');
    expect(nextLesson(lessonsOfMask(7), st({ done: ['check'], stamped: '2026-11-01' }))).toBe('check');
  });
});
