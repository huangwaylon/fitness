// The overlap checker: on the screen as it stands, every visible control and
// text block is checked for
//   hit     — a tap at its middle and 4 inset points lands on it (elementFromPoint: itself or inside it);
//   clip    — its text isn't cut: wider/taller than its box under overflow hidden with no ellipsis/line-clamp meant,
//             cut by an overflow-hidden ancestor, or run off the screen's side outside a sideways scroller;
//   covered — a text block's middle isn't under another element (a note under a pill);
//   layers  — the floating UI (fixed/absolute boxes placed against the screen, a map or a sheet: controls, toasts,
//             notes, pills, legends, attribution, FABs) don't intersect one another;
//   safe    — nothing important sits in the safe-area bands (status bar / Dynamic Island, home indicator) given by
//             `insets`, nor under the on-screen keyboard (e2e/keyboard.ts's visualViewport) when a field has focus;
//   target  — a control's hit is at least 44 × 44 (measured as sheet-hits.spec does: how far round its middle a tap
//             still lands on it, so a 32px chip drawn in a 44px ::after hit passes).
// Deliberate overlaps are allowed by name (ALLOW below, or a call's own `allow`), never by loosening the checks.
// Content a scroller can carry clear of a bar or a FAB doesn't count; at the scroller's end it does.
// Use: `await insets(page, IPHONE)` before goto (SAFARI_BAR at 393×659), open the screen with taps (WebKit), then
// `await settle(page); await noOverlaps(page, { insets: IPHONE })`: one line per issue (check, selector, rect, what's in
// the way). `overlaps()` returns them instead. The guard is e2e/overlap.spec.ts; a map state joins it with one
// noOverlaps call once the maps live in components/map/ (ALLOW already has the canvas, pins, attribution, a peek's
// cut list and the stub's markers). It can't see inside the GL canvas (labels under pills): look at a shot.
import { expect, type Page } from './fixtures.ts';

type Check = 'hit' | 'clip' | 'covered' | 'layers' | 'safe' | 'target';
type Rect = { x: number; y: number; w: number; h: number };
export interface Issue {
  check: Check;
  sel: string;
  rect: Rect;
  text: string;
  /** what's in the way (hit / covered / layers), or the measure (clip / target / safe) */
  detail: string;
  other?: string;
  otherRect?: Rect;
}
/** An allowance: `check` (or every check) on elements matching `sel`, optionally only against `other` (a CSS selector
 *  the element in the way or the other layer matches, itself or an ancestor); `why` is required: the reason it's meant. */
interface Allow { check?: Check | Check[]; sel: string; other?: string; why: string }
export interface Options {
  /** Safe-area bands in px (an iPhone 15 / 16 in the Home Screen app: IPHONE). Set as the CSS vars too (`insets()`). */
  insets?: { top: number; bottom: number };
  allow?: Allow[];
  /** Checks to run (default all). */
  only?: Check[];
  /** Under this px a target is reported (44). */
  minTarget?: number;
}

/** An iPhone 15 / 16's safe areas, portrait (the Dynamic Island's band, the home indicator's). */
export const IPHONE = { top: 59, bottom: 34 };
/** Safari with its toolbar showing (the 393×659 viewport): the page's box ends above the toolbar, no inset. */
export const SAFARI_BAR = { top: 0, bottom: 0 };

/** Deliberate overlaps, app-wide. Each says why. */
const ALLOW: Allow[] = [
  { sel: '.maplibregl-canvas, .maplibregl-canvas-container', why: 'the map canvas sits under every control by design' },
  { check: 'layers', sel: '.maplibregl-map', why: 'the map itself (an embedded one is small enough to count) under its own controls' },
  { check: ['clip', 'safe'], sel: '[data-sheet="peek"] [data-places-list], [data-sheet="peek"] .sheet', why: 'a peek shows a cut preview of its list' },
  { check: 'target', sel: '.stub-place, [data-map-stub] *', why: 'the logic tier’s stub markers (a drawn map hits a feature within 22 px)' },
  { check: ['hit', 'layers'], sel: '[data-map-stub], [data-map-stub] *', why: 'the logic tier’s stub stands in for the map (its pins the markers): under its own controls' },
  { check: ['hit', 'target', 'layers', 'safe'], sel: '.maplibregl-marker', why: 'map content (pins): under controls and sheets by design, the map pans' },
  { check: 'target', sel: '.maplibregl-ctrl-attrib a, [data-attrib] a', why: 'attribution links: inline text in a 9.5 px pill (the licences ask for the link, iOS Maps does the same)' },
  { check: 'layers', sel: '[data-look-stage] .figure', why: 'the closet figure’s box: its empty corner under the name plate' },
  { check: 'safe', sel: '#fake-keyboard', why: 'the simulated keyboard itself' },
  { sel: '#fake-keyboard', why: 'the simulated keyboard itself' }
];

/** Sets the safe-area vars as iOS would (env() is 0 in Playwright); call before the page loads. */
export const insets = (page: Page, i: { top: number; bottom: number } = IPHONE) =>
  page.addInitScript((i) => {
    const put = () => {
      const s = document.createElement('style');
      s.dataset.e2eInsets = '';
      s.textContent = `html:root { --safe-top: ${i.top}px !important; --safe-bottom: ${i.bottom}px !important; }`;
      document.head.appendChild(s);
    };
    if (document.head) put();
    else document.addEventListener('DOMContentLoaded', put);
  }, i);

/** Every finite animation on the page over (a sheet's open, a level's slide, a fold), and none started in the two
 *  frames after: one can start once another ends or a layout lands (保存した場所's locate disc eased to a peek
 *  measured a frame after its rows came; awaiting only the animations running at the call, the guard caught the disc
 *  mid-ease over the search field: a repeat run's 1 in 20). */
export const settle = (page: Page) =>
  page.evaluate(async () => {
    const running = () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity);
    const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let k = 0; k < 20; k++) {
      const now = running();
      if (now.length) await Promise.all(now.map((a) => a.finished.catch(() => {})));
      await frames();
      if (!running().length) return;
    }
  });

/** The issues on the screen as it stands. */
export async function overlaps(page: Page, o: Options = {}): Promise<Issue[]> {
  const arg = { insets: o.insets ?? { top: 0, bottom: 0 }, allow: [...ALLOW, ...(o.allow ?? [])], only: o.only ?? null, min: o.minTarget ?? 44 };
  return page.evaluate(audit, arg);
}

/** One line per issue (for a failure message or a report). */
export const describe = (is: Issue[]) =>
  is.map((i) => `${i.check.padEnd(7)} ${i.sel} @${r(i.rect)} «${i.text}» ${i.detail}${i.other ? ` ⟂ ${i.other}${i.otherRect ? ` @${r(i.otherRect)}` : ''}` : ''}`).join('\n');
const r = (b: Rect) => `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}×${Math.round(b.h)}`;

/** Fails with the list when the screen has any issue. */
export async function noOverlaps(page: Page, o: Options = {}) {
  const is = await overlaps(page, o);
  expect(is, describe(is)).toEqual([]);
}

// ---------------------------------------------------------------------------------------------------------------
// In the page (self-contained: page.evaluate sends its source).
function audit({ insets, allow, only, min }: { insets: { top: number; bottom: number }; allow: Allow[]; only: Check[] | null; min: number }): Issue[] {
  const out: Issue[] = [];
  const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
  const vv = window.visualViewport;
  const kbTop = vv && vv.height < H - 40 ? vv.offsetTop + vv.height : H; // the keyboard's top edge (H: none)
  const on = (c: Check) => !only || only.includes(c);
  const rect = (b: DOMRect | { left: number; top: number; right: number; bottom: number }): Rect => ({ x: b.left, y: b.top, w: b.right - b.left, h: b.bottom - b.top });
  const cs = (el: Element) => getComputedStyle(el);

  const sel = (el: Element): string => {
    const one = (e: Element) => {
      let s = e.tagName.toLowerCase();
      if (e.id && !/^\d|[^\w-]/.test(e.id)) return `${s}#${e.id}`;
      const data = [...e.attributes].find((a) => a.name.startsWith('data-') && !a.name.startsWith('data-svelte') && a.name !== 'data-typing');
      if (data) s += `[${data.name}${data.value && data.value.length < 24 ? `="${data.value}"` : ''}]`;
      const cls = [...e.classList].filter((c) => !/^svelte-|^s-/.test(c)).slice(0, 2);
      if (cls.length) s += `.${cls.join('.')}`;
      const al = e.getAttribute('aria-label');
      if (al && !data) s += `[aria-label="${al.slice(0, 20)}"]`;
      return s;
    };
    const parts: string[] = [];
    for (let e: Element | null = el; e && e !== document.body && parts.length < 3; e = e.parentElement) parts.unshift(one(e));
    return parts.join(' > ');
  };
  const txt = (el: Element) => (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const allowed = (c: Check, el: Element, other?: Element | null) =>
    allow.some((a) => {
      const cs = a.check === undefined ? null : Array.isArray(a.check) ? a.check : [a.check];
      if (cs && !cs.includes(c)) return false;
      if (!el.closest(a.sel)) return false;
      return !a.other || (!!other && !!other.closest(a.other));
    });
  const push = (i: Issue, el: Element, other?: Element | null) => {
    if (!allowed(i.check, el, other) && !(other && allowed(i.check, other, el) && i.check === 'layers')) out.push(i);
  };

  // Scope: what a finger can reach. A modal dialog makes the rest inert; open popovers sit above it.
  const modals = [...document.querySelectorAll('dialog')].filter((d) => d.matches(':modal'));
  const roots: Element[] = modals.length ? [modals[modals.length - 1]] : [document.body];
  roots.push(...[...document.querySelectorAll('[popover]')].filter((p) => p.matches(':popover-open')));
  const inScope = (el: Element) => roots.some((r) => r.contains(el)) && !el.closest('[inert]');

  const shown = (el: Element) => {
    const e = el as HTMLElement & { checkVisibility?: (o: object) => boolean };
    if (e.checkVisibility && !e.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) return false;
    const b = el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return false;
    for (let a: Element | null = el; a; a = a.parentElement) if (parseFloat(cs(a).opacity) < 0.05) return false;
    return true;
  };
  /** Its box as far as it's seen: cut by the screen and by every clipping ancestor (a scroller, overflow hidden). */
  const seen = (el: Element) => {
    const b = el.getBoundingClientRect();
    let l = Math.max(b.left, 0), t = Math.max(b.top, 0), rr = Math.min(b.right, W), bb = Math.min(b.bottom, H);
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = cs(a);
      if (s.position === 'fixed') break;
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const p = a.getBoundingClientRect();
        if (s.overflowX !== 'visible') ((l = Math.max(l, p.left)), (rr = Math.min(rr, p.right)));
        if (s.overflowY !== 'visible') ((t = Math.max(t, p.top)), (bb = Math.min(bb, p.bottom)));
      }
    }
    return { left: l, top: t, right: rr, bottom: bb, whole: l <= b.left + 0.5 && t <= b.top + 0.5 && rr >= b.right - 0.5 && bb >= b.bottom - 0.5 };
  };
  const scroller = (el: Element) => {
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = cs(a);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (a.scrollHeight > a.clientHeight + 1 || a.scrollWidth > a.clientWidth + 1)) return a;
      if (s.position === 'fixed') return null;
    }
    return null;
  };
  /** Whether scrolling `sc` can carry `el` clear of `h` (a sticky bar, a FAB, a footer laid over the scroller): under
   *  its top half with room to scroll back up, or its bottom half with room to scroll on. */
  const canClear = (sc: Element | null, el: Element, h: Element | null) => {
    if (!sc || !h) return false;
    let fl: Element | null = null;
    for (let a: Element | null = h; a && a !== sc; a = a.parentElement) if (/(fixed|sticky|absolute)/.test(cs(a).position)) { fl = a; break; }
    if (!fl && sc.contains(h)) return false; // in the flow with it: a real overlap
    // (which way clears it: the layer's side of the scroller; one in the flow (no layer), the element's side)
    // (a layer pinned by its bottom (a sticky footer over the keyboard) is a bottom one wherever it sits)
    const b = (fl ?? el).getBoundingClientRect(), p = sc.getBoundingClientRect();
    const pinned = fl ? cs(fl) : null;
    const up = pinned && (pinned.top === 'auto') !== (pinned.bottom === 'auto') ? pinned.bottom === 'auto' : (b.top + b.bottom) / 2 < (p.top + p.bottom) / 2;
    return up ? sc.scrollTop > 1 : sc.scrollTop < sc.scrollHeight - sc.clientHeight - 1;
  };
  const hits = (el: Element, x: number, y: number, strict = false) => {
    const h = document.elementFromPoint(x, y);
    if (!h) return { ok: !strict, h };
    // itself or inside it; or behind it (an ancestor: the point is outside its own shape, a rounded corner, a notch)
    if (h === el || el.contains(h) || (!strict && h.contains(el))) return { ok: true, h };
    // (WebKit's scroll indicator, shown a moment after a scroll, answers hit tests at a scroller's right edge; iOS's
    // never takes a tap)
    if (h.contains(el) && /(auto|scroll)/.test(cs(h).overflowY) && x > h.getBoundingClientRect().right - 22) return { ok: true, h };
    // a <label>'s control, an <svg>'s <use>: theirs
    if (h instanceof HTMLLabelElement && (h.control === el || h.contains(el))) return { ok: true, h };
    return { ok: false, h };
  };

  const INTERACTIVE = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=option], [role=menuitem], [role=link], .chip, [tabindex]:not([tabindex="-1"])';
  const controls = roots.flatMap((r) => [...r.querySelectorAll(INTERACTIVE)]).filter((el, i, a) => a.indexOf(el) === i && inScope(el) && shown(el) && cs(el).pointerEvents !== 'none')
    // the outermost of nested controls (a .chip that is a button: one)
    .filter((el) => !el.parentElement?.closest(INTERACTIVE) || el.matches('input, select, textarea'));

  // ---- hit + target
  for (const el of controls) {
    const s = seen(el);
    if (s.right - s.left < 4 || s.bottom - s.top < 4) continue; // scrolled out
    const cx = (s.left + s.right) / 2, cy = (s.top + s.bottom) / 2;
    let under = !hits(el, cx, cy).ok; // something over it (reported by hit, or a scroll away): its reach not measured
    if (on('hit')) {
      // the middle and each edge's middle, inset (a pill's or a disc's corners are outside its shape)
      const ix = Math.min(6, (s.right - s.left) / 4), iy = Math.min(6, (s.bottom - s.top) / 4);
      // (and every 24px along both middle lines between: a FAB over a wide row's end)
      const pts: [number, number][] = [[cx, cy], [s.left + ix, cy], [s.right - ix, cy], [cx, s.top + iy], [cx, s.bottom - iy]];
      for (let x = s.left + ix + 24; x < s.right - ix - 12; x += 24) pts.push([x, cy]);
      for (let y = s.top + iy + 24; y < s.bottom - iy - 12; y += 24) pts.push([cx, y]);
      // (content a scroller carries, under a layer outside it (a FAB, a sticky bar): scrolled clear, unless at the end)
      const sc = scroller(el);
      const miss = pts.map(([x, y]) => hits(el, x, y)).filter((p) => !p.ok);
      under ||= miss.length > 0;
      const lost = miss.filter((p) => !canClear(sc, el, p.h));
      if (lost.length) {
        const h = lost[0].h!;
        push({ check: 'hit', sel: sel(el), rect: rect(el.getBoundingClientRect()), text: txt(el), detail: `${lost.length}/${pts.length} points${!hits(el, cx, cy).ok ? ' (the middle too)' : ''}`, other: sel(h), otherRect: rect(h.getBoundingClientRect()) }, el, h);
      }
    }
    if (on('target') && s.whole && !under) {
      const inline = cs(el).display === 'inline' && !!el.parentElement && (el.parentElement.textContent ?? '').trim().length > (el.textContent ?? '').trim().length + 2;
      // (the last one showing at a sideways scroller's edge: its hit runs past the edge, a swipe brings it in)
      const row = (() => { for (let a = el.parentElement; a; a = a.parentElement) if (/(auto|scroll)/.test(cs(a).overflowX)) return a; return null; })();
      const rb = row?.getBoundingClientRect(), eb = el.getBoundingClientRect();
      const edge = !!rb && row!.scrollWidth > row!.clientWidth + 1 && (eb.left - rb.left < 6 || rb.right - eb.right < 6);
      if (!inline && !edge) {
        const reach = (dx: number, dy: number) => { let d = 0; while (d < 22 && hits(el, cx + dx * (d + 1), cy + dy * (d + 1), true).ok) d++; return d; };
        const w = Math.round(reach(-1, 0) + reach(1, 0) + 1), h = Math.round(reach(0, -1) + reach(0, 1) + 1);
        if (w < min || h < min) push({ check: 'target', sel: sel(el), rect: rect(el.getBoundingClientRect()), text: txt(el), detail: `hit ${w}×${h}` }, el);
      }
    }
  }

  // ---- text blocks: clip + covered
  const texts: Element[] = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const p = n.parentElement;
    if (p && n.textContent!.trim() && !texts.includes(p) && !p.closest('script, style, svg, template, noscript, .sr-only, .visually-hidden') && inScope(p) && shown(p)) texts.push(p);
  }
  const textRect = (el: Element) => {
    const rg = document.createRange();
    let l = Infinity, t = Infinity, rr = -Infinity, bb = -Infinity;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent!.trim()) continue;
      rg.selectNodeContents(n);
      for (const b of rg.getClientRects()) if (b.width > 0) ((l = Math.min(l, b.left)), (t = Math.min(t, b.top)), (rr = Math.max(rr, b.right)), (bb = Math.max(bb, b.bottom)));
    }
    return l === Infinity ? null : { left: l, top: t, right: rr, bottom: bb };
  };
  for (const el of texts) {
    const tr = textRect(el);
    if (!tr) continue;
    const s = seen(el);
    if (s.right - s.left < 2 || s.bottom - s.top < 2) continue; // scrolled out
    const st = cs(el);
    if (on('clip')) {
      const ellipsis = (e: Element) => cs(e).textOverflow === 'ellipsis' || (cs(e) as CSSStyleDeclaration & { webkitLineClamp?: string }).webkitLineClamp !== 'none' && !!(cs(e) as CSSStyleDeclaration & { webkitLineClamp?: string }).webkitLineClamp;
      const he = el as HTMLElement;
      const own = st.overflowX !== 'visible' && st.display !== 'inline' && he.scrollWidth > he.clientWidth + 1 && !ellipsis(el) && !/(auto|scroll)/.test(st.overflowX);
      const ownY = st.overflowY !== 'visible' && st.display !== 'inline' && he.scrollHeight > he.clientHeight + 1 && !ellipsis(el) && !/(auto|scroll)/.test(st.overflowY);
      let cut: Element | null = null;
      let cutBy = '';
      for (let a = ellipsis(el) ? null : el.parentElement; a && a !== document.documentElement && !cut; a = a.parentElement) {
        const s2 = cs(a);
        if (/(auto|scroll)/.test(s2.overflowX + s2.overflowY)) break; // a scroller: scrolling shows the rest
        if (ellipsis(a)) break;
        if (s2.overflowX === 'hidden' || s2.overflowX === 'clip' || s2.overflowY === 'hidden' || s2.overflowY === 'clip') {
          const p = a.getBoundingClientRect();
          const dx = Math.max(p.left - tr.left, tr.right - p.right), dy = Math.max(p.top - tr.top, tr.bottom - p.bottom);
          const inside = tr.right > p.left && tr.left < p.right && tr.bottom > p.top && tr.top < p.bottom;
          if (inside && ((s2.overflowX !== 'visible' && dx > 1.5) || (s2.overflowY !== 'visible' && dy > 1.5))) ((cut = a), (cutBy = `cut ${Math.round(Math.max(dx, dy))}px by`));
        }
        if (s2.position === 'fixed') break;
      }
      // (a sideways scroller carries it, or a box clips it and says so: an ellipsis, or the cut reported above)
      const sideways = ellipsis(el) || (() => { for (let a = el.parentElement; a; a = a.parentElement) if (cs(a).overflowX !== 'visible') return true; return false; })();
      const off = !sideways && (tr.left < -1 || tr.right > W + 1) && tr.right > 0 && tr.left < W;
      if (own || ownY) push({ check: 'clip', sel: sel(el), rect: rect(el.getBoundingClientRect()), text: txt(el), detail: own ? `text ${he.scrollWidth}px in ${he.clientWidth}px, no ellipsis` : `text ${he.scrollHeight}px tall in ${he.clientHeight}px` }, el);
      else if (cut) push({ check: 'clip', sel: sel(el), rect: rect(tr), text: txt(el), detail: cutBy, other: sel(cut), otherRect: rect(cut.getBoundingClientRect()) }, el, cut);
      else if (off) push({ check: 'clip', sel: sel(el), rect: rect(tr), text: txt(el), detail: 'runs off the screen' }, el);
    }
    if (on('covered') && st.pointerEvents !== 'none' && !el.closest(INTERACTIVE)) {
      const x = (Math.max(tr.left, s.left) + Math.min(tr.right, s.right)) / 2, y = (Math.max(tr.top, s.top) + Math.min(tr.bottom, s.bottom)) / 2;
      const h = document.elementFromPoint(x, y);
      // (a card's own stretched hit over its text: a control laid over its parent, the text's card)
      const own = !!h && h.matches(INTERACTIVE) && !!h.parentElement?.contains(el);
      const carried = canClear(scroller(el), el, h);
      if (h && h !== el && !el.contains(h) && !h.contains(el) && !own && !carried && cs(h).pointerEvents !== 'none')
        push({ check: 'covered', sel: sel(el), rect: rect(tr), text: txt(el), detail: 'its middle is under', other: sel(h), otherRect: rect(h.getBoundingClientRect()) }, el, h);
    }
  }

  // ---- layers: floating UI placed against the screen / a map / a sheet (not inside a small component)
  if (on('layers')) {
    const big = W * H * 0.4;
    const layers = roots.flatMap((r) => [r, ...r.querySelectorAll('*')]).filter((el) => {
      const p = cs(el).position;
      if (p !== 'fixed' && p !== 'absolute' && p !== 'sticky') return false;
      if (!inScope(el) || !shown(el) || el.matches('dialog')) return false;
      const b = el.getBoundingClientRect();
      if (b.width * b.height > big || b.width < 8 || b.height < 8) return false;
      if (!(el.textContent ?? '').trim() && !el.querySelector(INTERACTIVE) && !el.matches(INTERACTIVE)) return false; // a decoration
      if (b.right <= 0 || b.left >= W || b.bottom <= 0 || b.top >= H) return false;
      if (p === 'sticky') return false;
      if (/(auto|scroll)/.test(cs(el).overflowY + cs(el).overflowX)) return false; // a scroller: content, not a control
      // placed against something big (the screen, a map, a sheet), not a badge inside a button
      const cb = p === 'fixed' ? null : (el as HTMLElement).offsetParent;
      return !cb || cb === document.body || cb.getBoundingClientRect().width * cb.getBoundingClientRect().height > big * 0.75;
    });
    // the outermost of nested layers
    const tops = layers.filter((el) => !layers.some((o) => o !== el && o.contains(el)));
    for (let i = 0; i < tops.length; i++)
      for (let j = i + 1; j < tops.length; j++) {
        const a = tops[i].getBoundingClientRect(), b = tops[j].getBoundingClientRect();
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 2 && iy > 2)
          push({ check: 'layers', sel: sel(tops[i]), rect: rect(a), text: txt(tops[i]), detail: `overlap ${Math.round(ix)}×${Math.round(iy)}`, other: `${sel(tops[j])} «${txt(tops[j])}»`, otherRect: rect(b) }, tops[i], tops[j]);
      }
  }

  // ---- safe areas + keyboard: what stands still (not content a scroller carries)
  if (on('safe')) {
    const focused = document.activeElement?.matches('input, textarea, [contenteditable]') ? document.activeElement : null;
    const bands: [string, number, number][] = [];
    if (insets.top) bands.push(['the status bar / Dynamic Island', 0, insets.top]);
    if (insets.bottom) bands.push(['the home indicator', H - insets.bottom, H]);
    if (focused && kbTop < H) bands.push(['the keyboard', kbTop, H]);
    const things = [...controls, ...texts.filter((t) => !t.closest(INTERACTIVE))];
    for (const el of things) {
      if (scroller(el) && el !== focused) continue;
      const b = el.matches(INTERACTIVE) ? el.getBoundingClientRect() : textRect(el);
      if (!b) continue;
      for (const [name, t, bt] of bands) {
        const over = Math.min(b.bottom, bt) - Math.max(b.top, t);
        if (over > 2 && b.right > 0 && b.left < W) push({ check: 'safe', sel: sel(el), rect: rect(b), text: txt(el), detail: `${Math.round(over)}px under ${name}` }, el);
      }
    }
  }
  return out;
}
