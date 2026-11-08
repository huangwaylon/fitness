// A sheet's opening timed for the log (`perf.sheet`, contract/log.ts; docs/perf-plan.md B4): the tap that asked for it
// (`sheetTap`, a HUD button's), then from Sheet's showModal (`timeSheet`) its chunk in and the dialog shown, its content
// ready, its open animation's end, and the frames from the tap on. The opening is done at its animation's end, or at
// its first frame when it has none (the island's full-height sheets open at once: with no animation to wait for, the
// quiet used to start only at the 3 s cap, and `content` took any late change, a portrait drawn or a sync's numbers, for
// 1-3 s of building). Content ready (`content`): the last change inside it before QUIET_MS with none after the opening
// is done; a change after that quiet is `late` (the last one before the 3 s cap) and `what` names it (its tag and class).
// Logged at the cap, or when it closes before: each sheet's first opening a load, a fifth of the rest. Nothing at all
// while the log is off (the demo, the specs).
import { log, logOn } from '#lib/sync/log.ts';
import type { LogSheet } from '#lib/contract/log.ts';

/** A repeat opening's share logged. */
const REPEAT_SAMPLE = 0.2;
/** A tap this recent is the opening's start (else the opening itself: a sheet opened by code, a banner's さんか). */
const TAP_MS = 2500;
const QUIET_MS = 300, CAP_MS = 3000;

let tapAt = 0;
/** rAF times since the tap (or the opening), while one is being timed. */
let frames: number[] = [];
let looping = false;
const logged = new Set<LogSheet>();

function loop(): void {
  if (looping) return;
  looping = true;
  const f = (t: number) => {
    frames.push(t);
    if (t - frames[0] < CAP_MS + 500) requestAnimationFrame(f);
    else looping = false;
  };
  requestAnimationFrame(f);
}

/** A HUD button's tap that opens a sheet (the timing's start). */
export function sheetTap(): void {
  if (!logOn()) return;
  tapAt = performance.now();
  frames = [tapAt];
  loop();
}

/** The content's readiness from the changes inside the sheet (times, ascending) and the opening's end (`done`): the
 *  last change before QUIET_MS of none at or after `done` (`content`, `from` if none), and the last change after that
 *  quiet (`late`, -1 if none). Pure. */
export function readiness(changes: readonly number[], from: number, done: number): { content: number; late: number } {
  let content = from, i = 0;
  for (; i < changes.length; i++) {
    if (changes[i] - Math.max(done, content) >= QUIET_MS) break;
    content = Math.max(content, changes[i]);
  }
  return { content, late: i < changes.length ? changes[changes.length - 1] : -1 };
}

/** A changed node as a log token: its tag and its first own class (`span.av`), never its text. */
export function nodeToken(el: Element | null | undefined): string | undefined {
  if (!el) return undefined;
  const cls = [...el.classList].find((c) => !c.startsWith('svelte-'));
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`.replace(/[^A-Za-z0-9_.:/-]/g, '').slice(0, 40) || undefined;
}

/** Time this opening (Sheet, just before its showModal): `kept` its content was kept from an earlier one. */
export function timeSheet(dlg: HTMLDialogElement, sheet: LogSheet, kept: boolean): void {
  if (!logOn()) return;
  const first = !logged.has(sheet);
  const now = performance.now();
  const tapped = tapAt > 0 && now - tapAt < TAP_MS;
  const t0 = tapped ? tapAt : now;
  tapAt = 0;
  if (!first && Math.random() >= REPEAT_SAMPLE) return;
  logged.add(sheet);
  if (!tapped) frames = [now];
  loop();
  let anim = -1, done = -1;
  const changes: number[] = [];
  const nodes: (Element | null)[] = [];
  const mo = new MutationObserver((rs) => {
    const n = rs.at(-1)!.target;
    changes.push(performance.now());
    nodes.push(n instanceof Element ? n : n.parentElement);
  });
  mo.observe(dlg, { subtree: true, childList: true, attributes: true, characterData: true });
  const ended = (e: AnimationEvent) => {
    if (e.target === dlg && anim < 0) done = anim = performance.now();
  };
  dlg.addEventListener('animationend', ended);
  // (its first frame: the opening done then if the dialog runs no animation of its own)
  requestAnimationFrame((t) => {
    if (done < 0 && !dlg.getAnimations?.().length) done = Math.max(t, now);
  });
  const check = () => {
    const at = performance.now();
    if (dlg.open && at - t0 < CAP_MS) return void setTimeout(check, 100);
    mo.disconnect();
    dlg.removeEventListener('animationend', ended);
    const { content, late } = readiness(changes, now, done < 0 ? at : done);
    const until = Math.max(done, content);
    const fs = frames.filter((t) => t >= t0 - 1 && t <= until + 17);
    const g = fs.slice(1).map((t, i) => t - fs[i]);
    const what = nodeToken(nodes[late >= 0 ? nodes.length - 1 : changes.lastIndexOf(content)]);
    log('perf.sheet', {
      sheet, first, kept, chunk: Math.round(now - t0), content: Math.round(content - t0), anim: anim < 0 ? -1 : Math.round(anim - t0),
      late: late < 0 ? -1 : Math.round(late - t0), ...(what ? { what } : {}),
      long: Math.round(Math.max(0, ...g)), slow: g.filter((d) => d > 33).length
    });
  };
  setTimeout(check, 100);
}
