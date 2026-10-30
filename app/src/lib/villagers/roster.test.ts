// The roster ↔ the art on disk: every villager and special character has a render and an icon in the manifest (and
// the files exist), ids are unique, and both names are filled in.
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../../../static/art/manifest.json';
import { ROSTER, ROSTER_IDS, hostOf, isRosterId, resolveLook } from './roster.ts';
import { PERSONALITIES, SPECIES } from './species.ts';

const VILLAGERS = Object.values(ROSTER).filter((v) => !v.special);
const SPECIALS = ROSTER_IDS.filter((id) => ROSTER[id].special);

const FILES = manifest.files as Record<string, { path: string }>;
const ART = join(import.meta.dirname, '..', '..', '..', 'static', 'art');

describe('villager roster', () => {
  it('ids are unique, lowercase and match their entry', () => {
    expect(new Set(ROSTER_IDS).size).toBe(ROSTER_IDS.length);
    expect(ROSTER_IDS.length).toBe(Object.keys(ROSTER).length);
    expect(VILLAGERS).toHaveLength(158); // a dropped row is noticed
    expect(SPECIALS).toHaveLength(23);
    for (const id of ROSTER_IDS) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(ROSTER[id].id).toBe(id);
    }
  });

  it.each(ROSTER_IDS)('%s has both names, a species and a personality (none if special) and a colour', (id) => {
    const v = ROSTER[id];
    expect(v.nameJa.trim()).not.toBe('');
    expect(v.nameEn.trim()).not.toBe('');
    expect(v.nameJa).not.toMatch(/[A-Za-z]/);
    if (v.special) {
      expect(v.species).toBeNull();
      expect(v.personality).toBeNull();
    } else {
      expect(Object.keys(SPECIES)).toContain(v.species);
      expect(Object.keys(PERSONALITIES)).toContain(v.personality);
    }
    expect(['m', 'f']).toContain(v.gender);
    expect(v.colour).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it.each(ROSTER_IDS)('%s has a render and an icon on disk', (id) => {
    for (const key of [`villagers/${id}`, `villagers/${id}-icon`]) {
      expect(FILES[key], key).toBeDefined();
      expect(existsSync(join(ART, FILES[key].path)), FILES[key].path).toBe(true);
    }
  });

  it('the villagers span every species, every personality and both genders', () => {
    expect(new Set(VILLAGERS.map((v) => v.species))).toEqual(new Set(Object.keys(SPECIES)));
    expect(new Set(VILLAGERS.map((v) => v.personality))).toEqual(new Set(Object.keys(PERSONALITIES)));
    expect(new Set(VILLAGERS.map((v) => v.gender))).toEqual(new Set(['m', 'f']));
  });

  it('the special characters come first (たぬきち, しずえ…), then the villagers by species', () => {
    expect(ROSTER_IDS.slice(0, SPECIALS.length)).toEqual(SPECIALS);
    expect(SPECIALS.slice(0, 2)).toEqual(['tom-nook', 'isabelle']);
    expect(ROSTER.isabelle.nameJa).toBe('しずえ');
    expect(ROSTER['kk-slider'].nameEn).toBe('K.K. Slider');
    expect(ROSTER.label.nameJa).toBe('ことの'); // Nookipedia ja-name
    expect([ROSTER.orville.nameJa, ROSTER.wilbur.nameJa]).toEqual(['モーリー', 'ロドリー']);
  });

  it('names are unique in both languages', () => {
    const all = Object.values(ROSTER);
    expect(new Set(all.map((v) => v.nameJa)).size).toBe(all.length);
    expect(new Set(all.map((v) => v.nameEn)).size).toBe(all.length);
  });

  it('resolves unknown ids to the per-person default', () => {
    expect(isRosterId('anchovy')).toBe(true);
    expect(isRosterId('toString')).toBe(false);
    expect(resolveLook({ villager: 'anchovy' }).nameJa).toBe('アンチョビ');
    expect(resolveLook({ villager: 'nobody', person: 'B' }).id).toBe('anchovy');
    expect(resolveLook({ villager: null }).id).toBe('goldie');
  });

  it('knows which renders face right and which must never mirror', () => {
    expect(ROSTER.goldie.looksRight).toBe(true);
    expect(ROSTER.anchovy.looksRight).toBe(false);
    // Outfit numbers would read backwards if mirrored.
    for (const id of ['raymond', 'kid-cat', 'agent-s', 'rocket', 'tad', 'octavian', 'coach', 'tank', 'chabwick', 'curt', 'axel'] as const)
      expect(ROSTER[id].noMirror).toBe(true);
    expect(ROSTER.marcie.noMirror).toBe(true); // the star mark over one eye
    expect(ROSTER.bob.noMirror).toBe(false);
    // Special characters: K.K.'s guitar, the DAL text on Orville's mug and Wilbur's badge.
    for (const id of ['kk-slider', 'orville', 'wilbur'] as const) expect(ROSTER[id].noMirror).toBe(true);
    expect(ROSTER.orville.looksRight).toBe(true);
  });

  it('the host is しずえ unless a player picked her: then たぬきち', () => {
    expect(hostOf([null, 'goldie'])).toBe('isabelle');
    expect(hostOf([])).toBe('isabelle');
    expect(hostOf(['goldie', 'isabelle'])).toBe('tom-nook');
    expect(hostOf(['isabelle', undefined])).toBe('tom-nook');
  });
});
