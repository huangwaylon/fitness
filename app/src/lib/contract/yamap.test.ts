// YAMAP links and answers (contract/yamap.ts): only yamap.com's activity and model-course links over https, the API's
// URLs, and the answers as a hike's fields with nothing of the members kept. Every fixture here is invented (no real
// activity, person or place).
import { describe, expect, it } from 'vitest';
import { yamapImport, yamapLink, yamapUrls } from './yamap.ts';

/** An invented activity's answer, with the fields a real one carries that must never come through. */
const ACTIVITY = {
  activity: {
    id: 123456,
    title: ' 架空山（テスト）\n縦走 ',
    start_at: 1_790_020_800, // 2026-09-21 20:00 UTC: the 22nd in Tokyo
    finish_at: 1_790_038_800,
    time_zone: 9.0,
    distance: 8_345.6,
    cumulative_up: 812.4,
    cumulative_down: 790,
    course_constant: 18,
    duration: 18_090,
    description: 'a walker’s own words',
    members: [{ id: 1, name: '仮名さん', gender: 'female', birth_year: 1990 }],
    user: { id: 1, name: '仮名さん' },
    map: { id: 1, name: 'Testmap', prefectures: [{ id: 99, name: 'Kaku', full_name: '架空県' }, { id: 98, full_name: '仮想府' }, { id: 99, full_name: '架空県' }] },
    checkpoints: [
      { landmark: { name: 'Trailhead', name_ja: '登山口', coord: [150.1, 20.1], is_summit: false } },
      { landmark: { name: 'Mt. Kaku', name_ja: '架空山', coord: [150.11, 20.12], is_summit: true } },
      { landmark: { name: 'Mt. Kaku', name_ja: '架空山', coord: [150.11, 20.12], is_summit: true } },
      { landmark: { name: 'East Peak', name_ja: '', coord: [150.12, 20.13], is_summit: true } },
      { landmark: null }
    ]
  }
};

const TRACKS = {
  tracks: [
    { point: { coord: [150.1, 20.1], corrected_altitude: 500.2, altitude: 480 } },
    { point: { coord: [150.105, 20.11], corrected_altitude: null, altitude: 700 } },
    { point: { coord: ['x', 20.11] } },
    { point: { coord: [150.11, 20.12] } }
  ]
};

const MODEL = {
  model_course: {
    id: 77,
    name: '架空山周回コース',
    distance: 4_900,
    course_time: 12_720,
    cumulative_up: 571,
    cumulative_down: 572,
    course_constant: 9,
    area_text: '架空山周辺',
    prefectures: [],
    checkpoints: [{ landmark: { name: 'Mt. Kaku', name_ja: '架空山', coord: [150.11, 20.12], is_summit: true } }],
    activities: [{ id: 5, members: [{ gender: 'male', birth_year: 1980 }] }]
  }
};

describe('a link', () => {
  it('reads an activity or a model course on yamap.com over https, in a share sheet’s text too', () => {
    expect(yamapLink('https://yamap.com/activities/52529137')).toEqual({ kind: 'activity', id: '52529137' });
    expect(yamapLink('https://www.yamap.com/activities/1/?utm=x#top')).toEqual({ kind: 'activity', id: '1' });
    expect(yamapLink('https://yamap.com/model-courses/52')).toEqual({ kind: 'model', id: '52' });
    expect(yamapLink('YAMAPで活動日記を見る\nhttps://yamap.com/activities/42 です')).toEqual({ kind: 'activity', id: '42' });
  });

  it('refuses anything else: another host, scheme, port, user or path', () => {
    for (const u of [
      'http://yamap.com/activities/1',
      'https://yamap.com.evil.example/activities/1',
      'https://evil.example/yamap.com/activities/1',
      'https://evil.example/?u=https://yamap.com/activities/1',
      'https://api.yamap.com/v3/activities/1',
      'https://m.yamap.com/activities/1',
      'https://yamap.com@evil.example/activities/1',
      'https://user:pw@yamap.com/activities/1',
      'https://yamap.com:8443/activities/1',
      'https://yamap.com/activities/1/tracks',
      'https://yamap.com/activities/0123',
      'https://yamap.com/activities/1234567890123',
      'https://yamap.com/plans/5',
      'https://yamap.com/activities/%2e%2e/1',
      'javascript:alert(1)',
      ''
    ]) expect(yamapLink(u), u).toBeNull();
    expect(yamapLink(null as unknown as string)).toBeNull();
  });

  it('names the API’s two URLs', () => {
    expect(yamapUrls({ kind: 'activity', id: '9' })).toEqual({ meta: 'https://api.yamap.com/v3/activities/9', track: 'https://api.yamap.com/v3/activities/9/tracks' });
    expect(yamapUrls({ kind: 'model', id: '9' })).toEqual({ meta: 'https://api.yamap.com/v3/model_courses/9', track: 'https://api.yamap.com/v3/model_courses/9/tracks' });
  });
});

describe('the answers', () => {
  it('an activity: its title, day, prefectures, figures and summits; never its members', () => {
    const r = yamapImport({ kind: 'activity', id: '123456' }, ACTIVITY, TRACKS)!;
    expect(r.meta).toEqual({ name: '架空山（テスト） 縦走', area: '架空県・仮想府', status: 'done', date: '2026-09-22', src: 'yamap', ref: 'a123456', km: 8.3, gainM: 812, downM: 790, diff: 'moderate', time: '5:02' });
    expect(r.wpts).toEqual([{ lat: 20.12, lon: 150.11, name: '架空山' }, { lat: 20.13, lon: 150.12, name: 'East Peak' }]);
    expect(r.pts).toEqual([{ lat: 20.1, lon: 150.1, ele: 500.2 }, { lat: 20.11, lon: 150.105, ele: 700 }, { lat: 20.12, lon: 150.11, ele: 0 }]);
    const out = JSON.stringify(r);
    for (const s of ['仮名', 'gender', 'birth', 'female', '1990', 'walker']) expect(out).not.toContain(s);
  });

  it('a model course: one to do, its standard time, its area when no prefecture', () => {
    const r = yamapImport({ kind: 'model', id: '77' }, MODEL, TRACKS)!;
    expect(r.meta).toEqual({ name: '架空山周回コース', area: '架空山周辺', status: 'want', src: 'yamap', ref: 'm77', km: 4.9, gainM: 571, downM: 572, diff: 'easy', time: '3:32' });
    expect(JSON.stringify(r)).not.toContain('gender');
  });

  it('null for what the API doesn’t send; leaves out what it can’t read', () => {
    const a = { kind: 'activity' as const, id: '1' };
    expect(yamapImport(a, { model_course: {} }, TRACKS)).toBeNull();
    expect(yamapImport(a, ACTIVITY, { tracks: 'no' })).toBeNull();
    expect(yamapImport(a, '<!DOCTYPE html>', TRACKS)).toBeNull();
    const bare = yamapImport(a, { activity: { distance: -1, course_constant: 'x', start_at: 'x', duration: 1e9 } }, { tracks: [] })!;
    expect(bare.meta).toEqual({ name: 'YAMAP', area: '', status: 'done', src: 'yamap', ref: 'a1' });
    expect(bare.pts).toEqual([]);
  });
});
