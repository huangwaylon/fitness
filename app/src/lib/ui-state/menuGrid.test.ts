// The leaf menu's fixed grid (ui-state/menuGrid.ts): the rows and their order, every tile named, ボット only with a bot.
import { describe, expect, it } from 'vitest';
import { GROUP_LABEL, MENU_LABEL, menuGrid } from './menuGrid.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

describe('menuGrid', () => {
  it('three rows of three, the same order for everyone', () => {
    expect(menuGrid(true).map((g) => [g.id, g.items])).toEqual([
      ['daily', ['todo', 'english', 'bells']],
      ['out', ['travel', 'places', 'hiking']],
      ['other', ['wedding', 'bots', 'settings']]
    ]);
  });

  it('a phone with no bot (demo mode) has no ボット; the rest stays where it is', () => {
    const g = menuGrid(false);
    expect(g.flatMap((x) => x.items)).not.toContain('bots');
    expect(g[2].items).toEqual(['wedding', 'settings']);
    expect(g.slice(0, 2)).toEqual(menuGrid(true).slice(0, 2));
  });

  it('every row and tile has its name in both languages, each tile once', () => {
    const ids = menuGrid(true).flatMap((g) => g.items);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(MENU_LABEL).sort()).toEqual([...ids].sort());
    for (const key of [...Object.values(MENU_LABEL), ...Object.values(GROUP_LABEL)]) {
      expect((ja as Record<string, string>)[key], key).toBeTruthy();
      expect((en as Record<string, string>)[key], key).toBeTruthy();
    }
  });
});
