// 共有リンク's member side (shares.ts): the actions' bodies (no key of a link's in a URL, online only), the link's URL
// (the token in the fragment), and share / copy: the system sheet, a cancel never a failure, else the clipboard.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureTransport } from '#lib/sync/transport.ts';
import { copyUrl, listShares, makeShare, setShare, shareOrCopy, shareUrl, shareVisits } from './shares.ts';

vi.mock('#lib/sync/storage.ts', async (orig) => ({ ...(await orig<object>()), getKey: () => 'a'.repeat(64) }));

const URL_ = 'https://island-fund.pages.dev/s#AAAAAAAAAAAAAAAAAAAAAA';
const abort = () => Object.assign(new Error('cancelled'), { name: 'AbortError' });

describe('the actions', () => {
  afterEach(() => configureTransport({ fetch: (...a) => fetch(...a) }));
  it('post share_list / share_make / share_set / share_visits with the member’s key in the body', async () => {
    const bodies: Record<string, unknown>[] = [];
    configureTransport({ url: 'https://relay/api', fetch: (async (_u: string, init: RequestInit) => (bodies.push(JSON.parse(String(init.body))), new Response('{"ok":true,"rows":[]}'))) as typeof fetch });
    await listShares('trip', 'nz');
    await makeShare('trip', 'nz', 365, '  両親へ ');
    await makeShare('trip', 'nz', 7, '  ');
    await setShare('0123456789abcdef', { off: true });
    await shareVisits('0123456789abcdef');
    expect(bodies.map(({ rid: _r, sid: _s, ...b }) => b)).toEqual([
      { kind: 'trip', ref: 'nz', key: 'a'.repeat(64), action: 'share_list' },
      { kind: 'trip', ref: 'nz', days: 365, label: '両親へ', key: 'a'.repeat(64), action: 'share_make' },
      { kind: 'trip', ref: 'nz', days: 7, key: 'a'.repeat(64), action: 'share_make' },
      { id: '0123456789abcdef', off: true, key: 'a'.repeat(64), action: 'share_set' },
      { id: '0123456789abcdef', key: 'a'.repeat(64), action: 'share_visits' }
    ]);
  });
  it('the URL: the page and the token in its fragment', () => {
    expect(shareUrl('https://island-fund.pages.dev/s', 'A'.repeat(22))).toBe(URL_);
  });
});

describe('share or copy', () => {
  it('the system share sheet with the URL and the title', async () => {
    const share = vi.fn(async () => {}), writeText = vi.fn(async () => {});
    expect(await shareOrCopy(URL_, '沖縄', { share, clipboard: { writeText } as never })).toBe('shared');
    expect(share).toHaveBeenCalledWith({ url: URL_, title: '沖縄' });
    expect(writeText).not.toHaveBeenCalled();
  });
  it('a cancel (WebKit’s AbortError) is nothing: no copy, no failure', async () => {
    const writeText = vi.fn(async () => {});
    expect(await shareOrCopy(URL_, 'x', { share: async () => { throw abort(); }, clipboard: { writeText } as never })).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });
  it('no share sheet, or one refused (not a cancel): the clipboard; neither: failed', async () => {
    const writeText = vi.fn(async () => {});
    expect(await shareOrCopy(URL_, 'x', { clipboard: { writeText } as never })).toBe('copied');
    expect(await shareOrCopy(URL_, 'x', { share: async () => { throw new Error('NotAllowedError'); }, clipboard: { writeText } as never })).toBe('copied');
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(await shareOrCopy(URL_, 'x', {})).toBe('failed');
    expect(await copyUrl(URL_, { clipboard: { writeText: async () => { throw new Error('denied'); } } as never })).toBe(false);
  });
});
