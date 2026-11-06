import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hrefOf, otherLang, phaseLabel, pick, pieces, render } from './text.ts';
import '#lib/i18n/travel.ts';
import { fmtKm, setUnits } from './units.ts';
import { configureStorage } from '#lib/sync/storage.ts';

const store = new Map<string, string>();
const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

describe('the guides’ text', () => {
  beforeEach(() => {
    store.clear();
    configureStorage({ local: kv });
  });
  afterEach(() => {
    setUnits('km');
    configureStorage({ local: null });
  });

  it('shows the reader’s side, else the other', () => {
    expect(pick({ ja: '到着', en: 'Arrival' }, 'en')).toBe('Arrival');
    expect(pick({ ja: 'SNA 021' }, 'en')).toBe('SNA 021');
    expect(pick({ en: 'Lake 22' }, 'ja')).toBe('Lake 22');
    expect(pick(undefined, 'ja')).toBe('');
    expect(otherLang({ en: 'Lake 22' }, 'ja')).toBe('en');
    expect(otherLang({ ja: 'a', en: 'b' }, 'ja')).toBeNull();
  });
  it('renders the measures in the phone’s units', () => {
    expect(render('{km:20} from the airport', null)).toEqual([{ k: 'text', s: '20 km from the airport' }]);
    expect(render('{m:444} up, {c:29} out', null)).toEqual([{ k: 'text', s: '444 m up, 29°C out' }]);
    setUnits('mi');
    expect(fmtKm(9.8)).toBe('6.1 mi');
    expect(fmtKm(362)).toBe('225 mi');
    expect(render('{km:2} one way · {m:444} · {c:29}', null)).toEqual([{ k: 'text', s: '1.2 mi one way · 1,457 ft · 84°F' }]);
  });
  it('locks a private value until the note is in, then shows it', () => {
    expect(render('Booking #{p:carRef} ok', null)).toEqual([{ k: 'text', s: 'Booking #' }, { k: 'lock', key: 'carRef' }, { k: 'text', s: ' ok' }]);
    expect(render('Booking #{p:carRef} ok', { carRef: 'EV123' })).toEqual([{ k: 'text', s: 'Booking #EV123 ok' }]);
    // a key the note lacks stays locked
    expect(render('{p:ticket}', { carRef: 'x' })).toEqual([{ k: 'lock', key: 'ticket' }]);
  });
  it('resolves a link: https as written, a private one from the note, never anything else', () => {
    expect(hrefOf('https://maps.app.goo.gl/x', null)).toBe('https://maps.app.goo.gl/x');
    expect(hrefOf('{p:onboardingUrl}', null)).toBeNull();
    expect(hrefOf('{p:onboardingUrl}', { onboardingUrl: 'https://evertrail.example/on' })).toBe('https://evertrail.example/on');
    expect(hrefOf('{p:onboardingUrl}', { onboardingUrl: 'javascript:alert(1)' })).toBeNull();
  });
  it('cuts Japanese between words, never inside one', () => {
    expect(pieces('ニュープリマスを出発')).toEqual(['ニュープリマスを', '出発']);
    expect(pieces('入国審査、荷物受け取り、レンタカー')).toEqual(['入国', '審査、', '荷物', '受け取り、', 'レンタカー']);
    expect(pieces('2月10日発 · 予約番号 ')).toEqual(['2月', '10日', '発', ' ', '·', ' ', '予約', '番号', ' ']);
    expect(pieces('Land at Auckland (AKL)')).toEqual(['Land at Auckland (AKL)']);
    expect(pieces('ニュープリマスを出発')).toBe(pieces('ニュープリマスを出発'));
  });
  it('says where a trip stands (its boarding pass)', () => {
    expect(phaseLabel({ k: 'soon', days: 97 })).toBe('あと97日');
    expect(phaseLabel({ k: 'soon', days: 1 })).toBe('明日');
    expect(phaseLabel({ k: 'now', day: 2 })).toBe('2日目');
    expect(phaseLabel({ k: 'past' })).toBe('行ってきた');
  });
});
