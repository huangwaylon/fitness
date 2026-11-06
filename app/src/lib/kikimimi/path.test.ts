import { describe, expect, it } from 'vitest';
import { lessonsOfMask, matches, nextLesson, pathOf, type PathUnit } from './path.ts';
import type { UnitState } from './stamps.ts';

const u = (id: string, stage: string, domain: string, also?: string[]): PathUnit => ({
  id, name: id, stage, domain, host: 'diana', status: 'voiced', lessons: ['deai', 'bamen', 'check', 'oto'], ...(also && { also })
});
const st = (o: Partial<UnitState>): UnitState => ({ done: [], stamped: null, tally: null, partner: false, double: false, recheck: null, ...o });

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
