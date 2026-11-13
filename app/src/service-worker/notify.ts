// The service worker's ITS notifications (docs/backend.md "Service worker"; its/README.md "Push"): a push from the
// its-bot Worker becomes one notification at once, with the Worker's own words (title, body: written in the phone's
// language, so an older worker shows a newer kind), its `tag` (one stay's: its 予約確定 replaces its 仮押さえ), the app
// icon and the page to open; a push that can't be read still shows a generic line (a silent push is not allowed:
// Safari drops the subscription). A tap brings the app forward on ボット → 保養所: an open window is focused and told
// ({k: 'open', to: 'its'}), else the app opens at `?open=its`. Pure over what it is given, for tests.

/** A push that can't be read: 「保養所ボット：お知らせがあります」. */
const FALLBACK = { title: '保養所ボット', body: 'お知らせがあります', tag: 'its' };
/** Bounds on what is shown (the Worker's are tighter; a garbled one is cut, not refused). */
const TITLE_MAX = 80, BODY_MAX = 300, TAG_MAX = 64;

const text = (x: unknown, max: number): string | null => (typeof x === 'string' && x.trim() ? x.slice(0, max) : null);

/** The page a notification opens (the app reads `?open=its` once after boot: components/bots/open.svelte.ts). */
const openUrl = (scope: string): string => `${scope}?open=its`;

/** The notification for a push event's data (none, bad JSON, no title: the fallback). */
export function notificationFor(data: { text(): string } | null, scope: string): { title: string; options: NotificationOptions } {
  let n = FALLBACK;
  try {
    const m = data ? (JSON.parse(data.text()) as Record<string, unknown>) : null;
    const title = m && typeof m === 'object' ? text(m.title, TITLE_MAX) : null;
    if (m && title) n = { title, body: text(m.body, BODY_MAX) ?? '', tag: text(m.tag, TAG_MAX) ?? FALLBACK.tag };
  } catch {
    /* unreadable: the fallback */
  }
  return { title: n.title, options: { body: n.body, tag: n.tag, icon: `${scope}icons/icon-192.png`, data: { url: openUrl(scope) } } };
}

/** The app icon's badge (Badging API; absent on most browsers). */
type BadgeNav = { setAppBadge?: (n: number) => Promise<void> } | null | undefined;

/** A push shown: the notification first (nothing fetched before it), then the app icon's badge (保養所 clears it), the
 *  badge's failure, thrown or rejected, swallowed: it never stops or fails the notification. For the push event's
 *  waitUntil. */
export async function showPush(reg: { showNotification(title: string, o: NotificationOptions): Promise<void> }, nav: BadgeNav, data: { text(): string } | null, scope: string): Promise<void> {
  const n = notificationFor(data, scope);
  const shown = reg.showNotification(n.title, n.options);
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

/** A tap: a window already in the scope is focused and told to open 保養所, else the app opens on it. */
export async function openApp(clients: { matchAll(o: { type: 'window'; includeUncontrolled: boolean }): Promise<readonly WindowLike[]>; openWindow(url: string): Promise<unknown> }, scope: string): Promise<void> {
  const open = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  const mine = open.find((c) => new URL(c.url).pathname.startsWith(new URL(scope, c.url).pathname));
  if (mine) {
    await mine.focus().catch(() => {});
    mine.postMessage({ k: 'open', to: 'its' });
    return;
  }
  await clients.openWindow(openUrl(scope));
}
