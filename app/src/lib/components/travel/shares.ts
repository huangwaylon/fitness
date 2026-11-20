// 共有リンク's member side (docs/travel.md "Sharing"): the relay's share actions (online only, never queued: a link is
// made, listed and changed while connected), the link's URL, and share / copy (navigator.share where there is one, a
// cancel no failure; else the clipboard). Plain TS, unit-tested.
import { post, type ApiResult } from '#lib/sync/transport.ts';
import type { ShareKind, SharePreset, ShareRow, ShareVisit } from '#lib/contract/share.ts';

/** The visitor's page for a token: `page` (the app's `/s`, absolute) and the token in the fragment (never sent to
 *  Pages, never in a Referer). */
export const shareUrl = (page: string, token: string): string => `${page}#${token}`;

export const listShares = (kind: ShareKind, ref: string): Promise<ApiResult<{ rows: ShareRow[] }>> => post('share_list', { kind, ref });
export const makeShare = (kind: ShareKind, ref: string, days: SharePreset, label: string): Promise<ApiResult<{ row: ShareRow }>> =>
  post('share_make', { kind, ref, days, ...(label.trim() ? { label: label.trim() } : {}) });
export const setShare = (id: string, o: { days?: SharePreset; label?: string; off?: boolean }): Promise<ApiResult<{ row: ShareRow }>> => post('share_set', { id, ...o });
export const shareVisits = (id: string): Promise<ApiResult<{ row: ShareRow; visits: ShareVisit[] }>> => post('share_visits', { id });

/** How a share went: the share sheet took it, it was copied instead, it was cancelled (never an error), or neither
 *  could be done. */
export type Sent = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Copy `url` (the clipboard; false when it is refused). */
export async function copyUrl(url: string, nav: Pick<Navigator, 'clipboard'> = navigator): Promise<boolean> {
  try {
    await nav.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/** The system's share sheet (iOS's) with the link; where there is none, or it refuses (not a cancel), the clipboard. An
 *  AbortError is the visitor's cancel (WebKit throws it): nothing happened, nothing to say. */
export async function shareOrCopy(url: string, title: string, nav: Partial<Pick<Navigator, 'share' | 'clipboard'>> = navigator): Promise<Sent> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ url, title });
      return 'shared';
    } catch (e) {
      if ((e as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
    }
  }
  return nav.clipboard && (await copyUrl(url, nav as Pick<Navigator, 'clipboard'>)) ? 'copied' : 'failed';
}
