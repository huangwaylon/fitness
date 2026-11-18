// The text a phone shows and its contrast on what it sits on: every visible element with its own text, its colour
// composited over its effective background (the ancestors' background colours stacked down to the first opaque one),
// the WCAG ratio. Night's cream --text inherited into a fixed cream surface (a .obj-cream missing) reads ~1.1:1.
import type { Page } from './fixtures.ts';

type Low = { sel: string; text: string; fg: string; bg: string; ratio: number; flags: string[]; rect: { x: number; y: number; width: number; height: number } };

/** The visible text under `min`:1 within `root` (default: the page), sorted worst first. Flags: `img` (a gradient or
 *  an image on the way down: the bg is a guess), `pseudo` (a ::before / ::after painted under it), `bare` (nothing opaque
 *  under it but the page: over the 3D scene, the bg is the page's). */
export function lowContrast(page: Page, { min = 3, root = 'body' }: { min?: number; root?: string } = {}): Promise<Low[]> {
  return page.evaluate(([min, root]) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true })!;
    const rgba = (s: string): [number, number, number, number] => {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      cx.fillStyle = s;
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const over = (top: number[], under: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const hex = (c: number[]) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const pathOf = (el: Element) => {
      const out: string[] = [];
      for (let e: Element | null = el, i = 0; e && e !== document.body && i < 5; e = e.parentElement, i++) {
        const cls = [...e.classList].filter((c) => !c.startsWith('svelte-')).slice(0, 3).map((c) => '.' + c).join('');
        const data = [...e.attributes].find((a) => a.name.startsWith('data-') && !a.name.startsWith('data-sfx'));
        out.unshift(e.tagName.toLowerCase() + cls + (data ? `[${data.name}]` : ''));
      }
      return out.join(' > ');
    };
    const page = rgba(getComputedStyle(document.documentElement).backgroundColor || getComputedStyle(document.body).backgroundColor);
    const res: { sel: string; text: string; fg: string; bg: string; ratio: number; flags: string[]; rect: DOMRect }[] = [];
    const scope = document.querySelector(root) ?? document.body;
    for (const el of scope.querySelectorAll('*')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join(' ').trim();
      if (!own || /^[\s\p{P}\p{S}]*$/u.test(own)) continue;
      if (el.closest('svg, canvas, script, style, template, .sr-only')) continue;
      // (a disabled control's text may be faint: WCAG's exemption)
      if (el.closest('[disabled], [aria-disabled="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'contents') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
      // topmost at its middle (under a dialog or the scrim, not seen)
      const mx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), my = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const hit = document.elementFromPoint(mx, my);
      if (!hit || !(el.contains(hit) || hit.contains(el) || hit.parentElement === el.parentElement)) continue;
      let alpha = 1;
      for (let e: Element | null = el; e; e = e.parentElement) alpha *= Number(getComputedStyle(e).opacity);
      if (alpha < 0.05) continue;
      const flags: string[] = [];
      const layers: number[][] = [];
      let base: number[] | null = null;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.backgroundImage !== 'none') flags.push('img');
        if (s.filter !== 'none') flags.push('filter');
        const box = e.getBoundingClientRect();
        for (const p of ['::after', '::before']) {
          const ps = getComputedStyle(e, p);
          // (a pseudo under the text's middle: a disc inset in its hit box, not a lip or a band beside it)
          const [l, t, w, h] = [ps.left, ps.top, ps.width, ps.height].map(parseFloat);
          if (ps.content !== 'none' && ps.position === 'absolute' && mx >= box.left + l && mx <= box.left + l + w && my >= box.top + t && my <= box.top + t + h) {
            const c = rgba(ps.backgroundColor);
            if (c[3] > 0) { layers.push(c); flags.push('pseudo'); if (c[3] >= 0.99) { base = c; break; } }
          }
        }
        if (base) break;
        const c = rgba(s.backgroundColor);
        if (c[3] > 0) { layers.push(c); if (c[3] >= 0.99) { base = c; break; } }
      }
      if (!base) flags.push('bare');
      let bg = base ?? page;
      for (let i = layers.length - (base ? 2 : 1); i >= 0; i--) bg = over(layers[i], bg);
      const t = rgba(cs.color);
      const fg = over([t[0], t[1], t[2], t[3] * alpha], bg);
      const [a, b] = [lum(fg), lum(bg)];
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < min) res.push({ sel: pathOf(el), text: own.slice(0, 40), fg: hex(fg), bg: hex(bg), ratio: Math.round(ratio * 100) / 100, flags: [...new Set(flags)], rect: r.toJSON() });
    }
    return res.sort((x, y) => x.ratio - y.ratio);
  }, [min, root] as const) as Promise<Low[]>;
}
