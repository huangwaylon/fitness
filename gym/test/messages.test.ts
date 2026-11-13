// Tests for message formatting.
import { describe, expect, it } from 'vitest';
import { DAYS_TO_CHECK } from '../src/config.ts';
import { PROGRAMS, type Slot } from '../src/hacomono.ts';
import * as m from '../src/messages.ts';
import { ANY, SKIP, Store } from '../src/store.ts';
import { at } from '../src/time.ts';

const TODAY = '2026-10-03'; // a Saturday
const TRAINING = PROGRAMS[0]!;
const oct = (day: number, clock: string): number => at(`2026-10-${String(day).padStart(2, '0')}`, clock);

/** Days 4–5 set, 10/5 with a check-from the day before, and a far-off ANY. */
function setStore(): Store {
  const s = new Store();
  s.setRule('2026-10-04', SKIP, TODAY);
  s.setRule('2026-10-05', ['12:00', '14:00'], TODAY);
  s.setCheckFrom('2026-10-05', oct(4, '16:00'), TODAY);
  s.setRule('2026-10-20', ANY, TODAY);
  return s;
}

describe('messages', () => {
  it('labels days and rules', () => {
    expect(m.dayLabel('2026-10-05')).toBe('10/5（月）');
    expect(m.ruleLabel(ANY)).toBe('🔔 終日');
    expect(m.ruleLabel(SKIP)).toBe('🔕 通知オフ');
    expect(m.ruleLabel(['12:00', '13:00'])).toBe('⏰ 12:00〜13:00');
    expect(m.timeRange(oct(3, '21:30'), '22:00')).toBe('21:30〜22:00');
    expect(m.ruleLabel(undefined)).toBe('💤 まだチェックしない（3日前から自動で12:00〜13:00）');
  });

  it('includes the check-from in the day setting', () => {
    const s = new Store();
    s.setCheckFrom('2026-10-05', oct(4, '16:00'), TODAY);
    expect(m.daySetting(s, '2026-10-05', TODAY)).toBe('⏰ 12:00〜13:00　⏳ 10/4（日）16:00から');
  });

  it('leaves out the date of a same-day check-from', () => {
    const s = new Store();
    s.setCheckFrom('2026-10-05', oct(5, '16:00'), TODAY);
    expect(m.daySetting(s, '2026-10-05', TODAY)).toBe('⏰ 12:00〜13:00　⏳ 16:00から');
  });

  it('groups slot lines by day and time', () => {
    const slots: Slot[] = [...PROGRAMS].reverse().map((program) => ({ program, start: oct(4, '12:30') }));
    slots.push({ program: TRAINING, start: oct(3, '21:30') });
    expect(m.slotLines(slots)).toEqual([
      '10/3（土）',
      '・21:30〜22:00　💪 パーソナルトレーニング',
      '10/4（日）',
      '・12:30〜13:00　💪 パーソナルトレーニング・🧘 マシンピラティス',
    ]);
    expect(m.newSlots([{ program: TRAINING, start: oct(3, '12:00') }])).toEqual([
      '🟢 空きが出ました！', '10/3（土）', '・12:00〜12:30　💪 パーソナルトレーニング',
    ]);
  });

  it('lists what is open now', () => {
    const slot: Slot = { program: TRAINING, start: oct(3, '12:00') };
    expect(m.openNow([], false)).toEqual(['いまは空きがありません。引き続きチェックします。']);
    expect(m.openNow([], true)).toEqual(['取得できた範囲では、いま空きはありません。', '一部の情報を取得できませんでした。']);
    expect(m.openNow([slot], true)).toEqual([
      '🟢 いま空いている枠', '10/3（土）', '・12:00〜12:30　💪 パーソナルトレーニング', '一部の情報を取得できませんでした。',
    ]);
  });

  it('names the actual buttons in the help', () => {
    for (const label of [m.ANY_LABEL, m.SKIP_LABEL, m.RANGE, m.CHECK_FROM, m.RESET, m.SET_DAY, m.CHECK_SETTINGS, m.MENU]) {
      expect(m.HELP_TEXT).toContain(label);
    }
    expect(m.HELP_TEXT).toContain(`${DAYS_TO_CHECK}日間`);
    expect(m.HELP_TEXT.startsWith('❓ 使い方\n予約に空きが出たら')).toBe(true);
  });

  it('says in the menu text when checks are stopped', () => {
    expect(m.panelText(false)).not.toContain('停止中');
    expect(m.panelText(true)).toBe(
      '🏋️ ジムの空き枠お知らせ\nELEMENT 戸越銀座店で予約の空きが出たら、ここでお知らせします。\n'
        + '💪 パーソナルトレーニング・🧘 マシンピラティス（トレーナー指名なし）\n下のボタンで、日ごとに通知の設定を変えられます。\n'
        + '⏸️ チェックは停止中です。「🔧 チェック設定」から再開できます。',
    );
  });

  it('leaves an unknown name out of a change', () => {
    expect(m.changedBy('👍', 'Bob')).toBe('👍\nBobさんが変更しました');
    expect(m.changedBy('👍', '')).toBe('👍');
  });

  it('shows the status of every checked or set day', () => {
    const s = setStore();
    expect(m.status(s, TODAY, oct(3, '08:45'), null, true)).toEqual([
      '📋 日ごとの設定',
      '・10/3（土）　⏰ 12:00〜13:00',
      '・10/4（日）　🔕 通知オフ',
      '・10/5（月）　⏰ 12:00〜14:00　⏳ 10/4（日）16:00から',
      '・10/6（火）　⏰ 12:00〜13:00',
      '・10/20（火）　🔔 終日',
      '⚠️ 現在、ジムの予約サイトに接続しにくい状態です。',
      '15分ごとにチェック・前回 08:45・次回 —',
    ]);
    s.setPaused(true);
    expect(m.status(s, TODAY, null, null, false).at(-1)).toBe(m.CHECK_PAUSED);
  });

  it('formats the check settings', () => {
    const s = new Store();
    expect(m.checkSettings(s)).toBe('🔧 チェック設定\n・間隔：15分ごと\n・状態：▶️ チェック中');
    s.setPaused(true);
    expect(m.checkSettings(s)).toContain('・状態：⏸️ 停止中（通知しません）');
    expect(m.intervalNote(30)).toBe('🔧 チェックの間隔を30分ごとにしました');
    expect(m.intervalLabel(15.0)).toBe('15分ごと');
    expect(m.checkCooldown(12.2)).toBe('⏱️ 13秒ほど待ってから、もう一度お試しください。');
  });

  it('marks the day buttons with whole emoji', () => {
    const s = setStore();
    expect(['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-20']
      .map((d) => m.dayButton(s, d, TODAY))).toEqual([
      '10/3（土） ⏰', '10/4（日） 🔕', '10/5（月） ⏰⏳', '10/6（火） ⏰', '10/7（水） 💤', '10/20（火） 🔔',
    ]);
  });

  it('formats the day picker and day card texts', () => {
    const s = setStore();
    expect(m.pickDay('2026-10-05', '2026-10-11')).toBe(
      '🗓️ 10/5（月）〜10/11（日）\n日付を選んでください\n🔔 終日・🔕 通知オフ・⏰ 時間指定・💤 まだ・⏳ 開始時刻あり',
    );
    expect(m.pickDay(TODAY, TODAY)).toBe('🗓️ 10/3（土）\n日付を選んでください\n🔔 終日・🔕 通知オフ・⏰ 時間指定・💤 まだ・⏳ 開始時刻あり');
    expect(m.pickedDay(s, '2026-10-05', TODAY)).toBe('10/5（月）　いまの設定：⏰ 12:00〜14:00　⏳ 10/4（日）16:00から\nどうしますか？');
    expect(m.pickRangeEnd('2026-10-05', '12:30')).toBe('10/5（月）　12:30から何時まで通知しますか？');
    expect(m.fromAfterDay('2026-10-05')).toBe('チェック開始は10/5（月）までの日時にしてください。');
    expect(m.dayPassed('2026-10-02')).toBe('10/2（金）はもう過ぎています。');
  });

  it('answers settings changes', () => {
    const s = setStore();
    expect(m.dayChanged(s, '2026-10-05', TODAY)).toBe('👍 10/5（月）を ⏰ 12:00〜14:00　⏳ 10/4（日）16:00から にしました。');
    expect(m.dayReset(s, '2026-10-07', TODAY)).toBe(
      '👍 10/7（水）の設定をリセットしました。いまは 💤 まだチェックしない（3日前から自動で12:00〜13:00） です。',
    );
    expect(m.dayUnchanged(s, '2026-10-04', TODAY)).toBe('10/4（日）はすでに 🔕 通知オフ になっています。');
  });
});
