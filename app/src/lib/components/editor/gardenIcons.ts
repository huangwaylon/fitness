// The garden's icons in the editors (layout/garden.ts GARDEN_ICONS: NH's own, one sheet, static/room/editor/
// garden-icons.webp, scripts/garden-icons.ts): fetched once, the first time a palette shows them, each cut out as an
// image URL for the palette's <img> and the plan's canvas. Never on the island.
import { GARDEN_ICONS, ICON_COLS, ICON_PX } from '#lib/layout/garden.ts';
import { staticUrl } from '#lib/staticUrl.ts';

let sheet: Promise<Readonly<Record<string, string>>> | null = null;

/** Each garden icon by its catalog key (`garden:<name>`) → an image URL (none if the sheet won't load). */
export function gardenIcons(): Promise<Readonly<Record<string, string>>> {
  return (sheet ??= new Promise((ok) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = ICON_PX;
      const g = c.getContext('2d')!;
      const out: Record<string, string> = {};
      GARDEN_ICONS.forEach((name, i) => {
        g.clearRect(0, 0, ICON_PX, ICON_PX);
        g.drawImage(im, (i % ICON_COLS) * ICON_PX, Math.floor(i / ICON_COLS) * ICON_PX, ICON_PX, ICON_PX, 0, 0, ICON_PX, ICON_PX);
        out[`garden:${name}`] = c.toDataURL();
      });
      ok(out);
    };
    im.onerror = () => ok({});
    im.src = staticUrl('room/editor/garden-icons.webp');
  }));
}

/** A garden kind's variant's name (the pumpkin's colours, the vine's looks); another's own id. */
export function variantName(k: string, v: string): string {
  if (k === 'crop-pumpkin') return ({ orange: 'オレンジ', yellow: '黄色', green: '緑', white: '白' } as Record<string, string>)[v] ?? v;
  if (k === 'vine') return `${v.toUpperCase()}型`;
  return v;
}
