// A sheet's opening timed for the log (`perf.sheet`, contract/log.ts; docs/perf-plan.md B4): the tap that asked for it
// (`sheetTap`, a HUD button's), then from Sheet's showModal (`timeSheet`) its chunk in and the dialog shown, the last
// change inside it, its open animation's end, and the frames from the tap on. Logged once it is quiet (300 ms with no
// change after its animation, at most 3 s from the tap): each sheet's first opening a load, a fifth of the rest. Nothing
// at all while the log is off (the demo, the specs).
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
  let last = now, anim = -1;
  const mo = new MutationObserver(() => (last = performance.now()));
  mo.observe(dlg, { subtree: true, childList: true, attributes: true, characterData: true });
  const ended = (e: AnimationEvent) => {
    if (e.target === dlg && anim < 0) anim = performance.now();
  };
  dlg.addEventListener('animationend', ended);
  const check = () => {
    const at = performance.now();
    if (dlg.open && at - t0 < CAP_MS && (anim < 0 || at - Math.max(anim, last) < QUIET_MS)) return void setTimeout(check, 100);
    mo.disconnect();
    dlg.removeEventListener('animationend', ended);
    const until = Math.max(anim, last);
    const fs = frames.filter((t) => t >= t0 - 1 && t <= until + 17);
    const g = fs.slice(1).map((t, i) => t - fs[i]);
    log('perf.sheet', {
      sheet, first, kept, chunk: Math.round(now - t0), content: Math.round(last - t0), anim: anim < 0 ? -1 : Math.round(anim - t0),
      long: Math.round(Math.max(0, ...g)), slow: g.filter((d) => d > 33).length
    });
  };
  setTimeout(check, 100);
}
