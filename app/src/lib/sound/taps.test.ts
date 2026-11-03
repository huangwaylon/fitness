// Every tap has a sound (docs/design.md#taps): each tappable element in components/ and routes/
// names one in data-sfx (taps.ts), and the ones that leave it to their handler (`self`) or stay silent (`none`) say
// why here. A new button without a data-sfx fails this test.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TAP_SFX } from './taps.ts';
import { CUES } from './cues.ts';

const SRC = join(import.meta.dirname, '../..');
/** dev/: the reaction gallery, a tool page (its chips fire reactions, which carry their own cues); editor/: the layout
 *  editor, a desktop tool page for the members (a mouse and a keyboard; no game sounds, its disabled buttons plain). */
const SKIP = [/\/dev\//, /\/editor\//];

/** `self`: the handler (or what it sets off) plays the outcome's own cue. Where that sound comes from. */
const SELF: Record<string, string> = {
  'lib/components/island/Decor.svelte': 'a placed decoration jiggles with tick; in the decorate mode the mode plays its own',
  'lib/components/tent/TentEdit.svelte': 'tick to pick, turn or move a piece and for a tab, confirm to place and for a wallpaper, boop when it can\'t, undo to put away',
  'lib/components/tent/TentRoom.svelte': 'toggle-on / toggle-off for the room\'s light switch',
  'lib/components/ui/Bubble.svelte': 'finishing a line is silent (as Ⓐ skips text in NH); then しずえ hops: host-tap',
  'lib/components/ui/NavButton.svelte': 'the panel passes self: its ‹ plays back and its ✕ the panel-close tune (IslandPanel, the sheets)',
  'lib/components/ui/Sheet.svelte': 'backdrop / Esc: back',
  'lib/components/panel/SoundSection.svelte': 'toggle-on / toggle-off (効果音 previews a confirm); the slider ticks on change, not while dragged',
  'lib/components/sheets/HarvestOverlay.svelte': '受け取る！ → the item-get fanfare (harvest-receive), or the boop if it fails',
  'lib/components/wallet/BuyConfirm.svelte': '買う！ → purchase (the wallet’s buy), or the boop if the wallet fell short',
  'lib/components/island/IslandScene.svelte': 'a villager → villager-tap or emote-surprise (woken)',
  'lib/components/island/HudJar.svelte': 'the jar → jar-tap (R18: both look up at it), then the panel plays panel-open',
  'lib/components/island/HudHealth.svelte': 'the dumbbell → jar-tap (R18: both look up at it), then the popup plays panel-open',
  'lib/components/island/HudFood.svelte': 'the bowl → jar-tap (R18: both look up at it), then the popup plays panel-open',
  'lib/components/island/HudMenu.svelte': 'ずかん / せってい → jar-tap (R18: both look up at it), then its sheet plays panel-open',
  'lib/components/island/FruitTree.svelte': 'canopy → tree-shake; the fruit row and closing the popup → tick',
  'lib/components/island/TreeShakes.svelte': 'a branch → scene-twig; the wasps → scene-net, then scene-catch (too late: nothing)',
  'lib/components/island/Balloon.svelte': 'scene-balloon',
  'lib/components/island/Scenery.svelte': 'the campsite’s door → tick as its line about today’s guest is said',
  'lib/components/layoutEdit/IslandEdit.svelte': 'tick to pick, turn or move a thing and for a tab, confirm to put it down, boop when it can\'t, undo to put away (TentEdit\'s)',
  'lib/components/homes/HomePicker.svelte': 'これにする → confirm once the new look goes out (silent while it would not fit, or nothing changed)'
};

/** `none`: deliberately silent. */
const NONE: Record<string, string> = {
  'lib/components/ui/Toast.svelte': 'a banner with 取り消す: a tap only holds it (the button is the sound)',
  'routes/pair/+page.svelte': 'the key field: the system keyboard clicks',
  'lib/components/health/ValueInput.svelte': 'the goal fields (weight, Move): the system keyboard clicks',
  'lib/components/panel/VillagerPicker.svelte': 'name and search fields; the villager already chosen does nothing',
  'lib/components/panel/LangSection.svelte': 'the language already chosen does nothing',
  'lib/components/panel/IslandPanel.svelte': 'the tab already shown does nothing',
  'lib/components/health/Health.svelte': 'the period or person already shown does nothing; a dropdown ticks on change (setWho, setPeriod)',
  'lib/components/food/Food.svelte': 'the person or day already shown does nothing; the dropdown ticks on change',
  'lib/components/food/FoodSearch.svelte': 'the search field: the system keyboard clicks',
  'lib/components/food/FoodAmount.svelte': 'the grams field: the system keyboard clicks; the meal already chosen does nothing',
  'lib/components/food/FoodRepeat.svelte': 'the weekday preset already chosen does nothing',
  'lib/components/island/SayPicker.svelte': 'the phrase field: the system keyboard clicks',
  'lib/components/board/BoardView.svelte': 'the note field: the system keyboard clicks'
};

/** A real `disabled` swallows the tap (no boop). Only where silence is right; elsewhere use aria-disabled. */
const DISABLED: Record<string, string> = {
  'lib/components/island/IslandScene.svelte': 'villagers during the opening beats (not a "can\'t", the scene is still arriving)',
  'lib/components/panel/SoundSection.svelte': 'the volume slider while all sound is off (nothing could sound anyway)',
  'routes/pair/+page.svelte': 'つなぐ while the key is being checked (busy, not refused)',
  'lib/components/island/Scenery.svelte': 'the campsite’s door in the gallery’s still thumbnails (not a live island)'
};

function svelteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? svelteFiles(p) : n.endsWith('.svelte') ? [p] : [];
  });
}

/** The opening tag starting at `i` (`<…>`), skipping `>` inside quotes and `{…}`. */
function tagAt(src: string, i: number): string {
  let depth = 0, q: string | null = null;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'" || (c === '`' && depth > 0)) q = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return src.slice(i, j + 1);
  }
  return src.slice(i);
}

const TAPPABLE = /^<(button|a|input|select|textarea)\b|\srole="(button|switch|tab|radio|checkbox|link|menuitem|option|slider)"|\sonclick=/;

interface Tap { file: string; line: number; tag: string; sfx: string[] }

function scan(): Tap[] {
  const out: Tap[] = [];
  for (const path of [...svelteFiles(join(SRC, 'lib/components')), ...svelteFiles(join(SRC, 'routes'))]) {
    const file = relative(SRC, path);
    if (SKIP.some((r) => r.test(`/${file}`))) continue;
    const src = readFileSync(path, 'utf8').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
    const markup = src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, (m) => m.replace(/[^\n]/g, ' '));
    for (const m of markup.matchAll(/<[a-z][\w-]*/g)) {
      const tag = tagAt(markup, m.index);
      if (!TAPPABLE.test(tag) || (/^<a\b/.test(tag) && !/\shref=/.test(tag))) continue;
      const v = /\sdata-sfx=(?:"([^"]*)"|\{([^}]*)\})/.exec(tag);
      const sfx = !v ? [] : v[1] !== undefined ? [v[1]] : [...v[2].matchAll(/(?:^|[?:])\s*'([^']*)'/g)].map((x) => x[1]); // the branches of a ternary
      out.push({ file, line: markup.slice(0, m.index).split('\n').length, tag: tag.split('\n')[0].slice(0, 90), sfx });
    }
  }
  return out;
}

const taps = scan();
const VALID = new Set<string>([...TAP_SFX, 'self', 'none']);

describe('every tap has a sound (docs/design.md#taps)', () => {
  it('finds the app\'s tappables', () => {
    expect(taps.length).toBeGreaterThan(40);
  });
  it('every tappable names its sound in data-sfx', () => {
    const missing = taps.filter((t) => !t.sfx.length).map((t) => `${t.file}:${t.line} ${t.tag}`);
    expect(missing).toEqual([]);
  });
  it('every data-sfx value is a tap cue, self or none', () => {
    const bad = taps.flatMap((t) => t.sfx.filter((s) => !VALID.has(s)).map((s) => `${t.file}:${t.line} "${s}"`));
    expect(bad).toEqual([]);
  });
  it('self and none are explained here (where the sound comes from, or why silence)', () => {
    const unexplained = taps.flatMap((t) => [
      ...(t.sfx.includes('self') && !SELF[t.file] ? [`${t.file}:${t.line} self`] : []),
      ...(t.sfx.includes('none') && !NONE[t.file] ? [`${t.file}:${t.line} none`] : [])
    ]);
    expect(unexplained).toEqual([]);
    // and no stale entries
    for (const f of Object.keys(SELF)) expect(taps.some((t) => t.file === f && t.sfx.includes('self')), f).toBe(true);
    for (const f of Object.keys(NONE)) expect(taps.some((t) => t.file === f && t.sfx.includes('none')), f).toBe(true);
  });
  it('a control that "can\'t" uses aria-disabled (it still takes the tap and boops); a real disabled only where listed', () => {
    const off = taps.filter((t) => /\sdisabled=/.test(t.tag) && !DISABLED[t.file]).map((t) => `${t.file}:${t.line}`);
    expect(off).toEqual([]);
  });
  it('tap cues are UI cues: they sound under a sheet too', () => {
    for (const c of TAP_SFX) expect(CUES[c].world, c).toBeFalsy();
    expect(CUES.boop.world).toBeFalsy();
  });
});
