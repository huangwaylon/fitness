import { describe, expect, it } from 'vitest';
import { CATCH_LINES } from './catchLines.ts';
import { BUGS, FISH, JUNK } from './critters.ts';
import { SEA } from './sea.ts';
import { POND_FISH } from './pondFish.ts';
import ja from '#lib/i18n/catch.ja.json';

const names = ja as Record<string, string>;

describe("NH's catch lines", () => {
  it('every fish (sea and pond), bug, sea creature and piece of junk has its official line in Japanese and English', () => {
    const ids = [...Object.keys(FISH), ...Object.keys(POND_FISH), ...Object.keys(BUGS), ...Object.keys(SEA), ...JUNK] as (keyof typeof CATCH_LINES)[];
    expect(ids).toHaveLength(148 + 46 + 3); // 34 sea fish, 74 bugs, 40 sea creatures; 46 fresh-water fish; 3 junk
    expect(Object.keys(CATCH_LINES).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const [j, e] = CATCH_LINES[id];
      expect(j.trim(), id).not.toBe('');
      expect(e.trim(), id).not.toBe('');
      expect(j, id).not.toContain(';'); // one line each, not the alternatives
    }
  });
  it('each line names its own critter (the datamined ja line matched to the right message)', () => {
    for (const id of [...Object.keys(FISH), ...Object.keys(POND_FISH), ...Object.keys(BUGS)] as (keyof typeof CATCH_LINES)[]) {
      const name = (names[`critter.name.${id}`] ?? 'スズキ').replace(/\s/g, ''); // the sea bass has its own caption key
      expect(CATCH_LINES[id][0].replace(/\s/g, ''), id).toContain(name);
    }
    for (const id of Object.keys(SEA) as (keyof typeof CATCH_LINES)[]) {
      expect(CATCH_LINES[id][0].replace(/\s/g, ''), id).toContain(names[`sea.name.${id}`].replace(/\s/g, ''));
      expect(CATCH_LINES[id][0], id).toMatch(/とったよ！|とれちゃった！/); // NH's dive line: 「〇〇を とったよ！」
    }
    expect(CATCH_LINES['sea-bass'][1]).toBe("I caught a sea bass! No, wait—it's at least a C+!");
    expect(CATCH_LINES['sea-bass'][0]).toBe('スズキを 釣り上げた！\n鈴木・・・じゃなくて、鱸なのね！');
    expect(CATCH_LINES.carp).toEqual(['コイを 釣り上げた！\nカッコイーッ！', 'I caught a carp! If I catch another, they can carpool!']);
    expect(CATCH_LINES.blowfish).toEqual(['フグを 釣り上げた！\nてっさ、てっちり、フグざんまい！', "I caught a blowfish! I'm blown away!"]);
    expect(CATCH_LINES['puffer-fish']).toEqual(['ハリセンボンを 釣り上げた！\nイテテテ・・・', 'I caught a puffer fish! I thought you would be tougher, fish!']);
    expect(CATCH_LINES.loach[0]).toBe('ドジョウを 釣り上げた！\nあら エッサッサ～！'); // the first catch's, not the second's
    for (const [j] of Object.values(CATCH_LINES)) expect(j).not.toContain('\u3000'); // the game's wide spaces, as plain ones
  });
});
