// Timeline fixtures for the differential test: ten weeks around season 1 (calibration weeks, the first scored
// weeks, a month end + payday, the 正月 easy/pear-off weeks), both people, generated from a fixed seed. It covers
// late data after Sunday (including a late hard workout that removes a rest day), re-sent lower values, gym visits
// (double-fired Shortcuts, back-dated events, answers before/after the lock), ask-type workouts, check-ins with
// fill-ins, unticks and out-of-window ticks, purse spends/approvals/overdraws, transfers, harvest taps (late, wrong
// week), high-fives, prefs and sharing toggles, plus invalid events the server refused.
import type { LocalDate, PersonId } from '#lib/types.ts';
import { addDays, targetsFor, weekKeyOf } from '#lib/scoring/index.ts';
import type { Metric, Step, WorkoutIn } from './oracle.ts';

export const START: LocalDate = '2026-10-26';
export const END: LocalDate = '2027-01-08';

/** JST wall clock → ISO instant. */
export const jst = (date: LocalDate, hm: string): string => new Date(`${date}T${hm}:00+09:00`).toISOString();

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

let wseq = 0;
function workout(date: LocalDate, startHm: string, type: string, durationMin: number, avgHr: number | null): WorkoutIn {
  const startAt = `${date}T${startHm}:00+09:00`;
  const endAt = new Date(Date.parse(startAt) + durationMin * 60000).toISOString();
  return { extId: `w:${date}:${type.replace(/\s/g, '')}:${++wseq}`, date, type, startAt, endAt, durationMin, avgHr };
}

export function timeline(seed = 7): Step[] {
  const r = rng(seed);
  const pick = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const steps: Step[] = [];
  const add = (s: Step) => steps.push(s);
  const people: PersonId[] = ['A', 'B'];

  // Prefs and sharing (some invalid).
  add({ t: jst(START, '08:00'), op: 'pref', person: 'A', key: 'locale', value: 'en' });
  add({ t: jst(START, '08:01'), op: 'pref', person: 'B', key: 'villagerName', value: '  もち  ' });
  add({ t: jst(START, '08:02'), op: 'pref', person: 'B', key: 'villager', value: 'goldie' });
  add({ t: jst(START, '08:03'), op: 'pref', person: 'A', key: 'villager', value: 'Bad Name' });
  add({ t: jst(START, '08:04'), op: 'pref', person: 'A', key: 'villagerName', value: '   ' });
  add({ t: jst(START, '08:05'), op: 'pref', person: 'A', key: 'villagerName', value: 'x'.repeat(21) });
  add({ t: jst(START, '08:06'), op: 'share', person: 'A', metric: 'peach', on: true });
  add({ t: jst(START, '08:07'), op: 'share', person: 'B', metric: 'apple', on: true });
  add({ t: jst(START, '08:08'), op: 'share', person: 'B', metric: 'habits', on: true });
  add({ t: jst('2026-11-20', '12:00'), op: 'share', person: 'A', metric: 'peach', on: false });
  add({ t: jst('2026-11-21', '12:00'), op: 'share', person: 'A', metric: 'coconut', on: true });
  add({ t: jst('2026-12-03', '09:00'), op: 'pref', person: 'A', key: 'villagerName', value: 'まめ' });
  add({ t: jst('2026-12-10', '09:00'), op: 'pref', person: 'B', key: 'locale', value: 'en' });
  add({ t: jst('2026-12-11', '09:00'), op: 'pref', person: 'B', key: 'locale', value: 'ja' });

  // Daily health data, workouts, gym visits and check-ins.
  const finals = new Map<string, number>(); // `${person}|${date}|${metric}` → final value of the day
  const metricKey = (p: PersonId, d: LocalDate, m: string) => `${p}|${d}|${m}`;
  for (let d = START; d <= END; d = addDays(d, 1)) {
    const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
    for (const p of people) {
      const goal = p === 'A' ? 7500 : 6250;
      const steps = Math.round(goal * (0.5 + r()));
      const ex = Math.round(r() * (p === 'A' ? 45 : 30));
      finals.set(metricKey(p, d, 'steps'), steps);
      finals.set(metricKey(p, d, 'exercise_min'), ex);
      const dead = r() < 0.08; // phone not synced at all today
      if (!dead) {
        // Morning: yesterday's final values (late data for yesterday), today's partial.
        const y = addDays(d, -1);
        add({
          t: jst(d, hhmm(7 * 60 + Math.floor(r() * 90))), op: 'ingest', person: p,
          metrics: ([
            { date: y, metric: 'steps', value: finals.get(metricKey(p, y, 'steps')) ?? 0 },
            { date: y, metric: 'exercise_min', value: finals.get(metricKey(p, y, 'exercise_min')) ?? 0 },
            { date: d, metric: 'steps', value: Math.round(steps * 0.1) }
          ] as Metric[]).filter((m) => m.date >= START)
        });
        // Evening: today's mostly-final values, sometimes with a workout.
        const ws: WorkoutIn[] = [];
        const roll = r();
        if (p === 'A' && roll < 0.25) ws.push(workout(d, '07:00', 'Traditional Strength Training', 45, 120));
        else if (p === 'A' && roll < 0.4) ws.push(workout(d, '06:30', 'Running', 30, 165));
        else if (p === 'B' && roll < 0.25) ws.push(workout(d, '18:00', pick(['Yoga', 'High Intensity Interval Training', 'Core Training']), 40, 110));
        else if (p === 'B' && roll < 0.32) ws.push(workout(d, '18:00', 'Pilates', 50, 100));
        else if (roll > 0.95) ws.push(workout(d, '12:00', 'Yoga', 10, null)); // too short to ask
        add({
          t: jst(d, hhmm(21 * 60 + Math.floor(r() * 120))), op: 'ingest', person: p,
          metrics: [{ date: d, metric: 'steps', value: Math.round(steps * 0.9) }, { date: d, metric: 'exercise_min', value: ex }],
          workouts: ws
        });
        // Re-send of an older day with lower numbers (the sheet ignores it; the server keeps the max).
        if (r() < 0.1 && d > START) {
          add({ t: jst(d, '22:30'), op: 'ingest', person: p, metrics: [{ date: addDays(d, -1), metric: 'steps', value: 10 }] });
        }
        // Ask-type workouts: answered later (sometimes days later, sometimes after the lock).
        for (const w of ws) {
          if (!['Yoga', 'High Intensity Interval Training', 'Core Training'].includes(w.type) || w.durationMin < 15) continue;
          const lag = pick([0, 0, 1, 2, 5, 9, -1]);
          if (lag >= 0) add({ t: jst(addDays(d, lag), '23:10'), op: 'confirmWorkout', person: p, extId: w.extId, yes: r() < 0.6 });
        }
      }

      // Gym visits.
      if (p === 'A' && (dow === 2 || dow === 4) && r() < 0.8) {
        const ref = `A-visit-${d}`;
        add({ t: jst(d, '19:00'), op: 'presence', person: 'A', place: 'anytime', event: 'arrive', ref });
        if (r() < 0.2) add({ t: jst(d, '19:01'), op: 'presence', person: 'A', place: 'anytime', event: 'arrive' }); // double fire
        const leaveLater = r() < 0.15;
        if (leaveLater) add({ t: jst(d, '23:00'), op: 'presence', person: 'A', place: 'anytime', event: 'leave', at: jst(d, '20:10') });
        else add({ t: jst(d, hhmm(19 * 60 + 20 + Math.floor(r() * 60))), op: 'presence', person: 'A', place: 'anytime', event: 'leave' });
        const lag = pick([0, 1, 3, 8, -1]);
        if (lag >= 0) add({ t: jst(addDays(d, lag), '23:20'), op: 'confirmVisit', person: 'A', ref, yes: r() < 0.7 });
      }
      if (p === 'B' && dow === 6 && r() < 0.85) {
        add({ t: jst(d, '10:00'), op: 'presence', person: 'B', place: 'pt_studio', event: 'arrive', ref: `B-pt-${d}` });
        add({ t: jst(d, '11:05'), op: 'presence', person: 'B', place: 'pt_studio', event: 'leave' });
      }
      if (p === 'B' && dow === 3 && r() < 0.4) {
        const ref = `B-gym-${d}`;
        add({ t: jst(d, '07:00'), op: 'presence', person: 'B', place: 'anytime_b', event: 'arrive', ref });
        add({ t: jst(d, '07:50'), op: 'presence', person: 'B', place: 'anytime_b', event: 'leave' });
        add({ t: jst(addDays(d, pick([0, 2])), '21:00'), op: 'confirmVisit', person: 'B', ref, yes: true });
      }

      // Check-ins.
      const habits = targetsFor(p, weekKeyOf(d)).habits;
      const quietWeek = p === 'B' && d >= '2026-11-16' && d <= '2026-11-22'; // ticks only via the weekend block below
      for (const h of habits) {
        if (r() < 0.55 && !quietWeek) add({ t: jst(d, hhmm(20 * 60 + Math.floor(r() * 200))), op: 'checkin', person: p, date: d, habit: h, done: true });
      }
      if (r() < 0.15) add({ t: jst(d, '23:50'), op: 'checkin', person: p, date: d, habit: habits[0], done: false }); // untick
      if (r() < 0.15) add({ t: jst(d, '09:00'), op: 'checkin', person: p, date: addDays(d, -2), habit: habits[1], done: true }); // 48 h fill-in
      if (r() < 0.05) add({ t: jst(d, '09:05'), op: 'checkin', person: p, date: addDays(d, -3), habit: habits[2], done: true }); // too late
      if (r() < 0.03) add({ t: jst(d, '09:06'), op: 'checkin', person: p, date: d, habit: 'not_a_habit', done: true });
      if (r() < 0.1) add({ t: jst(d, hhmm(8 * 60 + Math.floor(r() * 600))), op: 'highfive', person: p });
    }
  }

  // A late hard workout synced on Monday removes Sunday's rest day: the payout drops, the jar keeps the max.
  const lateSun = '2026-11-22';
  add({ t: jst('2026-11-23', '08:30'), op: 'ingest', person: 'B', workouts: [workout(lateSun, '09:00', 'Running', 50, 170)] });
  // Monday unticks of the weekend (inside the 48 h window, before the lock): the final payout is lower than Sunday's.
  for (const d of ['2026-11-21', '2026-11-22']) {
    for (const h of targetsFor('B', '2026-11-16').habits) add({ t: jst('2026-11-22', '18:00'), op: 'checkin', person: 'B', date: d, habit: h, done: true });
    for (const h of targetsFor('B', '2026-11-16').habits) add({ t: jst('2026-11-23', '09:30'), op: 'checkin', person: 'B', date: d, habit: h, done: false });
  }
  // A big late walk raises last week's steps on Tuesday: top-up at Wednesday 04:00.
  add({ t: jst('2026-12-01', '12:00'), op: 'ingest', person: 'A', metrics: [{ date: '2026-11-29', metric: 'steps', value: 25000 }, { date: '2026-11-28', metric: 'exercise_min', value: 90 }] });
  // After the lock (Wednesday 04:00) late data still changes the live numbers but never the paid amounts.
  add({ t: jst('2026-12-02', '12:00'), op: 'ingest', person: 'B', metrics: [{ date: '2026-11-29', metric: 'steps', value: 30000 }] });

  // Harvest taps.
  for (let wk = '2026-11-02'; wk <= '2026-12-28'; wk = addDays(wk, 7)) {
    const sun = addDays(wk, 6);
    const mon = addDays(wk, 7);
    if (wk === '2026-11-23') {
      add({ t: jst(sun, '19:20'), op: 'harvest', person: 'A', week: wk }); // too early: not open yet
      add({ t: jst(sun, '20:00'), op: 'harvest', person: 'A' });
      add({ t: jst(addDays(sun, 7), '20:00'), op: 'harvest', person: 'B', week: wk }); // a week late: next harvest is open
      continue;
    }
    add({ t: jst(sun, hhmm(19 * 60 + 35 + Math.floor(r() * 180))), op: 'harvest', person: 'A' });
    add({ t: jst(r() < 0.5 ? sun : mon, '22:45'), op: 'harvest', person: 'B' });
    if (wk === '2026-11-09') add({ t: jst(mon, '23:00'), op: 'harvest', person: 'B' }); // repeat tap
  }

  // Purse (¥1,000 per person per week at score ≥ 60).
  add({ t: jst('2026-11-03', '12:00'), op: 'spend', person: 'A', ref: 'early', label: 'Coffee', amountYen: 500 }); // nothing earned yet
  add({ t: jst('2026-11-09', '12:00'), op: 'spend', person: 'A', ref: 's1', label: 'Cake', amountYen: 800 });
  add({ t: jst('2026-11-10', '12:00'), op: 'spend', person: 'B', ref: 'too-soon', label: 'Dinner', amountYen: 5000 }); // insufficient
  add({ t: jst('2026-11-23', '12:00'), op: 'spend', person: 'B', ref: 's2', label: 'Dinner', amountYen: 5000 }); // needs both
  add({ t: jst('2026-11-23', '13:00'), op: 'approve', person: 'B', ref: 's2' }); // own request: refused
  add({ t: jst('2026-11-24', '09:00'), op: 'approve', person: 'A', ref: 's2' });
  add({ t: jst('2026-11-25', '09:00'), op: 'approve', person: 'A', ref: 's2' }); // already spent
  add({ t: jst('2026-11-26', '09:00'), op: 'spend', person: 'B', ref: 's3', label: 'Spa', amountYen: 900000 }); // overdraw
  add({ t: jst('2026-12-08', '09:00'), op: 'spend', person: 'A', ref: 'early-trip', label: 'Trip fund', amountYen: 6000 }); // insufficient
  add({ t: jst('2026-12-14', '09:00'), op: 'spend', person: 'A', ref: 's4', label: 'Trip fund', amountYen: 6000 }); // pending
  add({ t: jst('2026-12-14', '10:00'), op: 'spend', person: 'B', ref: 's5', label: 'Ice cream', amountYen: 300 });
  add({ t: jst('2026-12-14', '10:01'), op: 'spend', person: 'B', ref: 's6', label: '  ', amountYen: 300 }); // invalid label
  add({ t: jst('2026-12-14', '10:02'), op: 'spend', person: 'B', ref: 's7', label: 'Half yen', amountYen: 1.5 }); // invalid amount
  add({ t: jst('2026-12-16', '09:00'), op: 'approve', person: 'B', ref: 's4' }); // insufficient now: stays pending
  add({ t: jst('2026-12-21', '09:00'), op: 'approve', person: 'B', ref: 's4' });

  // Transfers (payday cue).
  add({ t: jst('2026-11-30', '12:00'), op: 'transfer', person: 'A', month: '2026-11' }); // month not finished
  add({ t: jst('2026-12-26', '12:00'), op: 'transfer', person: 'A', month: '2026-11' }); // Dec 25 shows the payday cue first
  add({ t: jst('2026-12-27', '12:00'), op: 'transfer', person: 'B', month: '2026-11' }); // repeat
  add({ t: jst('2026-12-20', '12:00'), op: 'transfer', person: 'B', month: '2026-12' }); // month not finished

  return steps.map((s, i) => [s, i] as const).sort((x, y) => Date.parse(x[0].t) - Date.parse(y[0].t) || x[1] - y[1]).map(([s]) => s);
}

/** Checkpoint instants: every `everyH` hours, plus a minute either side of each settlement instant and midnight. */
export function checkpoints(everyH = 3): string[] {
  const out = new Set<number>();
  const start = Date.parse(jst(START, '00:00'));
  const end = Date.parse(jst(END, '23:59'));
  for (let t = start + 3600_000; t <= end; t += everyH * 3600_000) out.add(t);
  for (let wk = weekKeyOf(START); wk <= END; wk = addDays(wk, 7)) {
    for (const hm of ['19:29', '19:31', '23:59']) out.add(Date.parse(jst(addDays(wk, 6), hm)));
    for (const hm of ['03:59', '04:01']) out.add(Date.parse(jst(addDays(wk, 9), hm)));
    out.add(Date.parse(jst(addDays(wk, 7), '00:01')));
  }
  return [...out].filter((t) => t >= start && t <= end).sort((a, b) => a - b).map((t) => new Date(t).toISOString());
}
