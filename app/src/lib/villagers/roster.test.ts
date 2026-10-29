// The roster ↔ the art on disk: every villager has a render and an icon in the manifest (and the files exist),
// ids are unique, and both names are filled in.
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../../../static/art/manifest.json';
import { ROSTER, ROSTER_IDS, isRosterId, resolveLook } from './roster.ts';
import { PERSONALITIES, SPECIES } from './species.ts';

const FILES = manifest.files as Record<string, { path: string }>;
const ART = join(import.meta.dirname, '..', '..', '..', 'static', 'art');

describe('villager roster', () => {
  it('ids are unique, lowercase and match their entry', () => {
    expect(new Set(ROSTER_IDS).size).toBe(ROSTER_IDS.length);
    expect(ROSTER_IDS.length).toBe(Object.keys(ROSTER).length);
    for (const id of ROSTER_IDS) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(ROSTER[id].id).toBe(id);
    }
  });

  it.each(ROSTER_IDS)('%s has both names, a species, a personality and a colour', (id) => {
    const v = ROSTER[id];
    expect(v.nameJa.trim()).not.toBe('');
    expect(v.nameEn.trim()).not.toBe('');
    expect(v.nameJa).not.toMatch(/[A-Za-z]/);
    expect(Object.keys(SPECIES)).toContain(v.species);
    expect(Object.keys(PERSONALITIES)).toContain(v.personality);
    expect(['m', 'f']).toContain(v.gender);
    expect(v.colour).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it.each(ROSTER_IDS)('%s has a render and an icon on disk', (id) => {
    for (const key of [`villagers/${id}`, `villagers/${id}-icon`]) {
      expect(FILES[key], key).toBeDefined();
      expect(existsSync(join(ART, FILES[key].path)), FILES[key].path).toBe(true);
    }
  });

  it('spans every species, every personality and both genders', () => {
    const all = Object.values(ROSTER);
    expect(new Set(all.map((v) => v.species))).toEqual(new Set(Object.keys(SPECIES)));
    expect(new Set(all.map((v) => v.personality))).toEqual(new Set(Object.keys(PERSONALITIES)));
    expect(new Set(all.map((v) => v.gender))).toEqual(new Set(['m', 'f']));
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
    for (const id of ['raymond', 'kid-cat', 'agent-s', 'rocket', 'tad', 'octavian'] as const) expect(ROSTER[id].noMirror).toBe(true);
    expect(ROSTER.bob.noMirror).toBe(false);
  });
});
