// The workout types きろく offers for a workout added by hand (`workout_add`), in its order, with their Japanese UI
// labels. Dependency-free: the Apps Script bundle validates `workout_add` against the same list.

const WORKOUT_LABELS_JA: Record<string, string> = {
  'Traditional Strength Training': '筋力トレーニング',
  Pilates: 'ピラティス',
  Yoga: 'ヨガ',
  'Outdoor Walk': '屋外ウォーキング',
  'Outdoor Run': '屋外ランニング',
  Cycling: 'サイクリング',
  Swimming: '水泳',
  Dance: 'ダンス',
  'High Intensity Interval Training': '高強度インターバルトレーニング'
};

export const WORKOUT_TYPES = Object.keys(WORKOUT_LABELS_JA);

export function workoutLabel(type: string, locale: 'ja' | 'en'): string {
  return locale === 'ja' ? (WORKOUT_LABELS_JA[type] ?? type) : type;
}
