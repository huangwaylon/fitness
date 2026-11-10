// A room piece's icon on an <img> (もようがえ's tray, the shop): `use:roomIcon={code}`. A loose icon is its URL at once
// (the img's own lazy loading); a packed one (items.ts iconPacked: the rugs', the critters', the wallpapers' and
// floors') is cut from its pack once the img nears the view, so a tab's grid fetches the packs it shows, not all.
import { iconPacked, iconSrc, iconUrl } from './items.ts';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function roomIcon(img: HTMLImageElement, code: string): { update(code: string): void; destroy(): void } {
  let want = code, seen = false;
  let io: IntersectionObserver | null = null;
  const show = () => {
    const c = want;
    if (!iconPacked(c)) return void (img.src = iconUrl(c));
    if (!seen) return void (img.src = BLANK);
    void iconSrc(c).then((u) => {
      if (u && want === c) img.src = u;
    });
  };
  if (typeof IntersectionObserver === 'function')
    io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting) || seen) return;
      seen = true;
      io?.disconnect();
      show();
    }, { rootMargin: '160px' });
  else seen = true;
  io?.observe(img);
  show();
  return {
    update(c: string) {
      if (c === want) return;
      want = c;
      show();
    },
    destroy() {
      io?.disconnect();
    }
  };
}
