// The service worker's notifications (docs/backend.md "Service worker"; its/README.md "Push"; docs/todo.md
// "Reminders"): a push from the its-bot Worker or the relay (やること's reminders: contract/push.ts TodoPushPayload)
// becomes one notification at once, with the sender's own words (title, body: written in the phone's language, so an
// older worker shows a newer kind), its `tag` (one stay's: its 予約確定 replaces its 仮押さえ; one item's), the app
// icon and the page to open; a push that can't be read still shows a generic line (a silent push is not allowed:
// Safari drops the subscription). A tap brings the app forward where the push said (`open`): やること at its item, a hike's (the page's own, never a push) on its trail, else ボット → 保養所: an open window is focused and told
// ({k: 'open', to, item?, trail?}), else the app opens at `?open=todo&item=…` / `?open=hike&trail=…` /
// `?open=its`. Only ITS's set the app icon's badge (保養所 clears it). Pure over what
// it is given, for tests.

/** A push that can't be read: 「保養所ボット：お知らせがあります」. */
const FALLBACK = { title: '保養所ボット', body: 'お知らせがあります', tag: 'its' };
/** Bounds on what is shown (the Worker's are tighter; a garbled one is cut, not refused). */
const TITLE_MAX = 80, BODY_MAX = 300, TAG_MAX = 64;

const text = (x: unknown, max: number): string | null => (typeof x === 'string' && x.trim() ? x.slice(0, max) : null);

/** Where a tap goes: 保養所, やること (its item, when the push named it), or a hike's trail (the page's own
 *  notification, never a push: hiking/map/notify.ts). */
export type OpenAt = { to: 'its' } | { to: 'todo'; item?: string } | { to: 'hike'; trail: string };
const TODO_ID = /^d[0-9a-z]{6,24}$/;
/** A trail's slug (the guide's 'lake-22', a registered hike's 'u-h…'). */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function openOf(x: unknown): OpenAt {
  const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : null;
  if (o?.to === 'hike' && typeof o.trail === 'string' && o.trail.length <= 64 && SLUG.test(o.trail)) return { to: 'hike', trail: o.trail };
  if (o?.to !== 'todo') return { to: 'its' };
  const id = (v: unknown) => (typeof v === 'string' && TODO_ID.test(v) ? v : undefined);
  const item = id(o.item);
  return { to: 'todo', ...(item && { item }) };
}

/** The page a notification opens (the app reads `?open=` once after boot: island/Hud.svelte). */
function openUrl(scope: string, at: OpenAt = { to: 'its' }): string {
  const q = new URLSearchParams({ open: at.to });
  if (at.to === 'todo' && at.item) q.set('item', at.item);
  if (at.to === 'hike') q.set('trail', at.trail);
  return `${scope}?${q}`;
}

/** The notification for a push event's data (none, bad JSON, no title: the fallback). */
export function notificationFor(data: { text(): string } | null, scope: string): { title: string; options: NotificationOptions; open: OpenAt } {
  let n = FALLBACK, open: OpenAt = { to: 'its' };
  try {
    const m = data ? (JSON.parse(data.text()) as Record<string, unknown>) : null;
    const title = m && typeof m === 'object' ? text(m.title, TITLE_MAX) : null;
    if (m && title) {
      n = { title, body: text(m.body, BODY_MAX) ?? '', tag: text(m.tag, TAG_MAX) ?? FALLBACK.tag };
      open = openOf(m.open);
    }
  } catch {
    /* unreadable: the fallback */
  }
  const url = openUrl(scope, open);
  return { title: n.title, open, options: { body: n.body, tag: n.tag, icon: `${scope}icons/icon-192.png`, data: open.to === 'its' ? { url } : { url, open } } };
}

/** The app icon's badge (Badging API; absent on most browsers). */
type BadgeNav = { setAppBadge?: (n: number) => Promise<void> } | null | undefined;

/** A push shown: the notification first (nothing fetched before it), then the app icon's badge (保養所 clears it), the
 *  badge's failure, thrown or rejected, swallowed: it never stops or fails the notification. For the push event's
 *  waitUntil. */
export async function showPush(reg: { showNotification(title: string, o: NotificationOptions): Promise<void> }, nav: BadgeNav, data: { text(): string } | null, scope: string): Promise<void> {
  const n = notificationFor(data, scope);
  const shown = reg.showNotification(n.title, n.options);
  if (n.open.to !== 'its') return shown;
  try {
    await nav?.setAppBadge?.(1);
  } catch {
    /* no badge: the notification still shows */
  }
  await shown;
}

interface WindowLike {
  url: string;
  focus(): Promise<unknown>;
  postMessage(m: unknown): void;
}

/** A tap (`data`: the notification's, which says where): a window already in the scope is focused and told where to
 *  open, else the app opens there. */
export async function openApp(clients: { matchAll(o: { type: 'window'; includeUncontrolled: boolean }): Promise<readonly WindowLike[]>; openWindow(url: string): Promise<unknown> }, scope: string, data?: unknown): Promise<void> {
  const at = openOf(data && typeof data === 'object' ? (data as { open?: unknown }).open : null);
  const open = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  const mine = open.find((c) => new URL(c.url).pathname.startsWith(new URL(scope, c.url).pathname));
  if (mine) {
    await mine.focus().catch(() => {});
    mine.postMessage({ k: 'open', ...at });
    return;
  }
  await clients.openWindow(openUrl(scope, at));
}
