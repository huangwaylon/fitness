// A lazily loaded part's strings (index.ts addStrings): its Japanese at once, its English fetched only once English is
// wanted, whether the part came before the switch or after it; Japanese meanwhile.
import { describe, expect, it, vi } from 'vitest';
import { addStrings, loadEnglish, t } from './index.ts';
import { i18n } from './state.svelte.ts';

describe('addStrings', () => {
  it('English only once wanted, for a part before the switch and one after', async () => {
    const early = vi.fn(async () => ({ default: { 'zz.early': 'Early' } }));
    addStrings({ 'zz.early': '前' }, early);
    expect([t('zz.early'), early.mock.calls.length]).toEqual(['前', 0]);
    await loadEnglish();
    expect([t('zz.early', undefined, 'en'), early.mock.calls.length]).toEqual(['Early', 1]);
    const rev = i18n.rev;
    let land!: () => void;
    const late = vi.fn(() => new Promise<{ default: Record<string, string> }>((r) => (land = () => r({ default: { 'zz.late': 'Late' } }))));
    addStrings({ 'zz.late': '後' }, late);
    await Promise.resolve();
    expect(t('zz.late', undefined, 'en')).toBe('後'); // (Japanese till it lands)
    land();
    await vi.waitFor(() => expect(t('zz.late', undefined, 'en')).toBe('Late'));
    expect(i18n.rev).toBeGreaterThan(rev); // (what's on screen reads it again)
  });
});
