// kikimimi/tags.ts: every item is tagged, every tag maps to a skill (docs/kikimimi.md "What's measured").
import { describe, expect, it } from 'vitest';
import { BANK } from './source.ts';
import { FEATURES, SKILLS, featureSkill, skillsOf, tagged, tagsOf } from './tags.ts';

describe('the tags', () => {
  it('has an entry for every item of levels 1-3 and none stray', () => {
    expect(BANK.filter((it) => it.lv < 4 && !tagged(it.id)).map((it) => it.id)).toEqual([]);
    expect(BANK.filter((it) => it.lv === 4 && !it.tags).map((it) => it.id)).toEqual([]);
  });
  it('maps every feature to a skill and every item to a primary skill', () => {
    for (const f of FEATURES) expect(SKILLS).toContain(featureSkill(f));
    for (const it of BANK) {
      const s = skillsOf(it);
      expect(SKILLS, it.id).toContain(s.primary);
      expect(s.also).not.toContain(s.primary);
    }
  });
  it('reads the type, features and pragmatic layer', () => {
    const by = (id: string) => BANK.find((it) => it.id === id)!;
    expect(skillsOf(by('w1-right'))).toEqual({ primary: 'lr', also: [] });
    expect(skillsOf(by('w3-gotta'))).toEqual({ primary: 'reduce', also: [] });
    expect(skillsOf(by('n1-reps-1'))).toEqual({ primary: 'num', also: [] });
    expect(skillsOf(by('r3-coffee'))).toEqual({ primary: 'indirect', also: ['reduce'] });
    expect(skillsOf(by('r2-close'))).toEqual({ primary: 'reply', also: [] });
    expect(skillsOf(by('p2-scale'))).toEqual({ primary: 'detail', also: ['indirect'] });
    expect(skillsOf(by('m4-brilliant')).primary).toBe('indirect');
    expect(skillsOf(by('w4-better'))).toEqual({ primary: 'reduce', also: [] });
    expect(tagsOf(by('r3-coffee'))).toEqual({ features: ['wanna'], pragmatic: 'refusal' });
  });
  it('covers every skill in levels 1-3', () => {
    const seen = new Set(BANK.filter((it) => it.lv < 4).flatMap((it) => [skillsOf(it).primary, ...skillsOf(it).also]));
    expect([...SKILLS].filter((s) => !seen.has(s))).toEqual([]);
  });
});
