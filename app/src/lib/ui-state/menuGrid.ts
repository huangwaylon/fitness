// The leaf menu's grid (docs/design.md "Island" Menu, the user's B1 of 2026-11-25): one fixed layout for everyone (A, B
// and the guest), three rows of three under a small label each. No per-person order or hiding (the retired prefs:
// contract/menu.ts). Pure.

export type MenuItem = 'todo' | 'english' | 'bells' | 'travel' | 'places' | 'hiking' | 'wedding' | 'bots' | 'settings';
export interface MenuGroup { id: 'daily' | 'out' | 'other'; items: MenuItem[] }

/** The rows, in order: 毎日 (the day's own), お出かけ (going out), ほか. */
const GRID: readonly MenuGroup[] = [
  { id: 'daily', items: ['todo', 'english', 'bells'] },
  { id: 'out', items: ['travel', 'places', 'hiking'] },
  { id: 'other', items: ['wedding', 'bots', 'settings'] }
];

/** Each row's label and each tile's name (i18n keys; kanji, as the menu's names have been). */
export const GROUP_LABEL: Record<MenuGroup['id'], string> = { daily: 'island.menuDaily', out: 'island.menuOut', other: 'island.menuOther' };
export const MENU_LABEL: Record<MenuItem, string> = {
  todo: 'panel.todo', english: 'panel.english', bells: 'island.bellsRow', travel: 'panel.travel', places: 'panel.places', hiking: 'panel.hiking',
  wedding: 'panel.wedding', bots: 'panel.bots', settings: 'island.settings'
};

/** The grid this phone draws: ボット only on a phone with a bot (demo mode has none), everything else always. */
export const menuGrid = (bots: boolean): MenuGroup[] => GRID.map((g) => ({ ...g, items: g.items.filter((id) => bots || id !== 'bots') }));
