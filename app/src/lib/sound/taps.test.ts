// Every tap has a sound (docs/design/sound.md §13 "Every tap"): each tappable element in components/ and routes/
// names one in data-sfx (taps.ts), and the ones that leave it to their handler (`self`) or stay silent (`none`) say
// why here. A new button without a data-sfx fails this test.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TAP_SFX } from './taps.ts';
import { CUES } from './cues.ts';

const SRC = join(import.meta.dirname, '../..');
/** dev/: the reaction gallery, a tool page (its chips fire reactions, which carry their own cues). */
const SKIP = [/\/dev\//];

/** `self`: the handler (or what it sets off) plays the outcome's own cue. Where that sound comes from. */
const SELF: Record<string, string> = {
  'lib/components/ui/PhoneButton.svelte': 'opens the phone: ShimaPhone plays phone-open',
  'lib/components/island/Hud.svelte': 'the ribbon opens the phone into きろく: phone-open',
  'lib/components/ui/Bubble.svelte': 'finishing a line is silent (the blips stop, as Ⓐ skips text in NH); then しずえ hops: host-tap',
  'lib/components/ui/NavButton.svelte': 'the phone passes self: its ‹ plays back and its ✕ the phone-close tune (ShimaPhone)',
  'lib/components/ui/Sheet.svelte': 'backdrop / Esc: back on a paper sheet, phone-close on the phone (ShimaPhone)',
  'lib/components/phone/ShimaPhone.svelte': 'phone-app, back, phone-close',
  'lib/components/phone/SoundApp.svelte': 'toggle-on / toggle-off (効果音 previews a confirm); the slider ticks on change, not while dragged',
  'lib/components/sheets/HarvestOverlay.svelte': '受け取る！ → the item-get fanfare (harvest-receive), or the boop if it fails',
  'lib/components/wallet/BuyConfirm.svelte': '買う！ → purchase (the wallet’s buy), or the boop if the wallet fell short',
  'lib/components/kiroku/NumberPad.svelte': 'each key → key / key-fn (typed digits too)',
  'lib/components/island/IslandScene.svelte': 'a villager → villager-tap or emote-surprise (woken)',
  'lib/components/island/JarSpot.svelte': 'the jar → jar-tap',
  'lib/components/island/FruitTree.svelte': 'canopy → tree-shake; the fruit row and closing the popup → tick',
  'lib/components/island/Balloon.svelte': 'scene-balloon'
};

/** `none`: deliberately silent. */
const NONE: Record<string, string> = {
  'lib/components/ui/Toast.svelte': 'a banner with 取り消す: a tap only holds it (the button is the sound)',
  'routes/pair/+page.svelte': 'the key field: the system keyboard clicks',
  'lib/components/kiroku/ValueInput.svelte': 'the weight / Move goal field: the system keyboard clicks',
  'lib/components/wallet/MenuEditor.svelte': 'name and price fields: the system keyboard clicks',
  'lib/components/phone/VillagerApp.svelte': 'name and search fields; the villager already chosen does nothing',
  'lib/components/phone/LangApp.svelte': 'the language already chosen does nothing',
  'lib/components/kiroku/Kiroku.svelte': 'the tab already shown does nothing',
  'lib/components/kiroku/GoalCard.svelte': 'the person already shown does nothing'
};

/** A real `disabled` swallows the tap (no boop). Only where silence is right; elsewhere use aria-disabled. */
const DISABLED: Record<string, string> = {
  'lib/components/island/IslandScene.svelte': 'villagers during the opening beats (not a "can\'t", the scene is still arriving)',
  'lib/components/island/JarSpot.svelte': 'the jar during the opening beats',
  'lib/components/phone/SoundApp.svelte': 'the volume slider while all sound is off (nothing could sound anyway)',
  'routes/pair/+page.svelte': 'つなぐ while the key is being checked (busy, not refused)'
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

describe('every tap has a sound (sound.md §13)', () => {
  it('finds the app\'s tappables', () => {
    expect(taps.length).toBeGreaterThan(45);
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
