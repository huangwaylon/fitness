import { describe, expect, it } from 'vitest';
import { CATCH_LINES } from './catchLines.ts';
import { BUGS, FISH, JUNK } from './critters.ts';
import ja from '#lib/i18n/ja.json';

const names = ja as Record<string, string>;

describe("NH's catch lines", () => {
  it('every fish, bug and piece of junk has its official line in Japanese and English', () => {
    const ids = [...Object.keys(FISH), ...Object.keys(BUGS), ...JUNK] as (keyof typeof CATCH_LINES)[];
    expect(ids).toHaveLength(84);
    expect(Object.keys(CATCH_LINES).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const [j, e] = CATCH_LINES[id];
      expect(j.trim(), id).not.toBe('');
      expect(e.trim(), id).not.toBe('');
      expect(j, id).not.toContain(';'); // one line each, not the alternatives
    }
  });
  it('each line names its own critter (the datamined ja line matched to the right message)', () => {
    for (const id of [...Object.keys(FISH), ...Object.keys(BUGS)] as (keyof typeof CATCH_LINES)[]) {
      const name = (names[`critter.name.${id}`] ?? 'スズキ').replace(/\s/g, ''); // the sea bass has its own caption key
      expect(CATCH_LINES[id][0].replace(/\s/g, ''), id).toContain(name);
    }
    expect(CATCH_LINES['sea-bass'][1]).toBe("I caught a sea bass! No, wait—it's at least a C+!");
    expect(CATCH_LINES['sea-bass'][0]).toBe('スズキを 釣り上げた！\n鈴木・・・じゃなくて、鱸なのね！');
  });
});
