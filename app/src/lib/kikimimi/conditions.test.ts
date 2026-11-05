// ききみみ's speech conditions (docs/kikimimi.md "Conditions"): what each condition does (conditions.ts condPlan), which
// clips get one (condOf: their own, or a phone or PA channel's), the source hash they give a clip, the noise beds on
// disk, and the report showing every conditioned clip mixed as its plan says.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANK, BEDS, COND_KINDS, channelOf, clipItems, type Cond } from './bank.ts';
import { NOISE } from './staging.ts';
import { COND_MAX_WER, SNR, codecArgs, condOf, condPlan, condSource, stepFilter, type Step } from './conditions.ts';
import { CLIPS } from './clips.ts';

const SCRIPTS = join(import.meta.dirname, '../../../scripts');
const ops = (steps: readonly Step[]) => steps.map((s) => s.op);
const c = (kind: Cond['kind'], level: Cond['level'] = 'light', bed?: Cond['bed']): Cond => ({ kind, level, ...(bed && { bed }) });

describe('kikimimi conditions: the plan per condition', () => {
  it('a phone line: band-passed 300-3400 Hz, compressed, through µ-law; heavy narrower, harder, G.726 and hiss', () => {
    const p = condPlan(c('phone'));
    expect(ops(p.steps)).toEqual(['band', 'comp', 'codec']);
    expect(p.steps[0]).toMatchObject({ lo: 300, hi: 3400 });
    expect(p.steps[2]).toMatchObject({ codec: 'mulaw' });
    expect(p.chime).toBe(false);
    expect(p.bed).toBeNull();
    const h = condPlan(c('phone', 'heavy'));
    expect(ops(h.steps)).toEqual(['band', 'comp', 'hiss', 'codec']);
    expect(h.steps[0]).toMatchObject({ lo: 350, hi: 3200 });
    expect(h.steps[3]).toMatchObject({ codec: 'g726', kbps: 24 });
  });

  it("a voicemail: the caller's small room, then the phone line", () => {
    const p = condPlan(c('voicemail'));
    expect(ops(p.steps)).toEqual(['room', 'band', 'comp', 'codec']);
    expect(p.steps[0]).toMatchObject({ op: 'room' });
    expect((p.steps[0] as Extract<Step, { op: 'room' }>).rt60).toBeLessThan(0.5);
  });

  it('a PA: a horn band, compressed, a hall (RT60 1.0 s light, 1.6 s heavy), after a chime', () => {
    const p = condPlan(c('pa')), h = condPlan(c('pa', 'heavy'));
    expect(ops(p.steps)).toEqual(['band', 'comp', 'room']);
    expect(p.chime && h.chime).toBe(true);
    expect(p.steps[2]).toMatchObject({ rt60: 1.0 });
    expect(h.steps[2]).toMatchObject({ rt60: 1.6 });
    expect((h.steps[2] as Extract<Step, { op: 'room' }>).wet).toBeGreaterThan((p.steps[2] as Extract<Step, { op: 'room' }>).wet);
  });

  it('a noise bed at its SNR (light +15 dB, heavy +10), with a lead-in and a tail; a channel’s bed at the source for a call, the listener for a PA', () => {
    expect(SNR).toEqual({ light: 15, heavy: 10 });
    for (const bed of BEDS) {
      const p = condPlan(c(bed)), h = condPlan(c(bed, 'heavy'));
      expect(p.steps).toEqual([]);
      expect(p.bed).toEqual({ id: bed, snr: 15, at: 'listener' });
      expect(h.bed!.snr).toBe(10);
      expect(p.pre).toBeGreaterThan(0.3);
      expect(p.post).toBeGreaterThan(0.2);
      expect(p.chime).toBe(false);
    }
    expect(condPlan(c('phone', 'light', 'street')).bed).toEqual({ id: 'street', snr: 15, at: 'source' });
    expect(condPlan(c('pa', 'heavy', 'station')).bed).toEqual({ id: 'station', snr: 10, at: 'listener' });
    expect(() => condPlan(c('cafe', 'light', 'street'))).toThrow();
  });

  it('every kind and level has a plan with its loose WER bound and a key', () => {
    for (const kind of COND_KINDS)
      for (const level of ['light', 'heavy'] as const) {
        const p = condPlan(c(kind, level));
        expect(p.key).toBe(`${kind}:${level}`);
        expect(p.maxWer).toBe(COND_MAX_WER[level]);
      }
    expect(condPlan(c('pa', 'light', 'station')).key).toBe('pa:light+station');
  });

  it('the ffmpeg filters and codec arguments of the steps', () => {
    expect(stepFilter({ op: 'band', lo: 300, hi: 3400, poles: 2 })).toBe('highpass=f=300,lowpass=f=3400,highpass=f=300,lowpass=f=3400');
    expect(stepFilter({ op: 'comp', threshold: -22, ratio: 3, attack: 5, release: 80, makeup: 2 })).toBe('acompressor=threshold=-22dB:ratio=3:attack=5:release=80:makeup=2');
    expect(() => stepFilter({ op: 'hiss', snr: 30 })).toThrow();
    expect(codecArgs({ op: 'codec', codec: 'mulaw' })).toEqual(['-ar', '8000', '-c:a', 'pcm_mulaw']);
    expect(codecArgs({ op: 'codec', codec: 'g726', kbps: 24 })).toEqual(['-ar', '8000', '-c:a', 'adpcm_g726', '-b:a', '24k']);
  });
});

describe('kikimimi conditions: which clips, and their hashes', () => {
  it("an item's own condition wins; a phone or PA channel gets its light one, a voicemail its own; face to face and video stay clean", () => {
    const tags = (conditions: ('phone' | 'voicemail' | 'pa' | 'video')[]) => ({ seed: 1, register: 'service' as const, pragmatic: 'literal' as const, conditions });
    expect(condOf({ cond: c('cafe', 'heavy'), tags: tags(['phone']) })).toEqual(c('cafe', 'heavy'));
    expect(condOf({ tags: tags(['phone']) })).toEqual(c('phone'));
    expect(condOf({ tags: tags(['voicemail']) })).toEqual(c('voicemail'));
    expect(condOf({ tags: tags(['pa']) })).toEqual(c('pa'));
    expect(condOf({ channel: 'pa' })).toEqual(c('pa'));
    expect(condOf({ tags: tags(['video']) })).toBeNull();
    expect(condOf({})).toBeNull();
  });

  it('a clean clip keeps its master hash; a condition, its plan or its bed changes the hash', () => {
    const m = 'abcdef0123';
    expect(condSource(m, null)).toBe(m);
    const pa = condSource(m, condPlan(c('pa')));
    expect(pa).toMatch(/^[0-9a-f]{10}$/);
    expect(pa).not.toBe(m);
    expect(condSource(m, condPlan(c('pa')))).toBe(pa);
    expect(condSource(m, condPlan(c('pa', 'heavy')))).not.toBe(pa);
    expect(condSource('abcdef0124', condPlan(c('pa')))).not.toBe(pa);
    const cafe = condSource(m, condPlan(c('cafe')), { 'bed:cafe': '1111111111' });
    expect(condSource(m, condPlan(c('cafe')), { 'bed:cafe': '2222222222' })).not.toBe(cafe);
    expect(condSource(m, condPlan(c('street')), { 'bed:street': '1111111111' })).not.toBe(cafe);
  });

  it('levels 1-3 are clean; every phone and PA clip of levels 4-5 has a condition; NOISE names items with scenes, never a word item', () => {
    const clips = BANK.flatMap(clipItems);
    for (const it of clips.filter((it) => it.lv < 4)) expect(condOf(it), it.id).toBeNull();
    for (const it of clips.filter((it) => channelOf(it) === 'phone' || channelOf(it) === 'pa')) expect(condOf(it), it.id).not.toBeNull();
    for (const id of Object.keys(NOISE)) {
      const it = BANK.find((x) => x.id === id);
      expect(it, id).toBeDefined();
      expect(it!.lv, id).toBe(4);
      expect(it!.type, id).not.toBe('word');
      expect(it!.cond, id).toEqual(NOISE[id]);
    }
    // level 4 stays fair: mostly light
    const l4 = clips.filter((it) => it.lv === 4 && condOf(it));
    expect(l4.filter((it) => condOf(it)!.level === 'heavy').length / l4.length).toBeLessThan(0.15);
  });
});

describe('kikimimi conditions: the beds and the mixed clips', () => {
  const beds = JSON.parse(readFileSync(join(SCRIPTS, 'tts/beds/beds.json'), 'utf8')) as Record<string, { seconds: number; licence: string; made: string; whisper: string }>;

  it('every bed is a small committed m4a, made here (no third-party audio), with no words whisper can hear', () => {
    expect(Object.keys(beds).sort()).toEqual([...BEDS].sort());
    for (const b of BEDS) {
      const f = join(SCRIPTS, `tts/beds/${b}.m4a`);
      expect(existsSync(f), b).toBe(true);
      expect(statSync(f).size, b).toBeLessThan(160 * 1024);
      expect(beds[b].licence, b).toMatch(/^ours/);
      expect(beds[b].seconds, b).toBeGreaterThanOrEqual(20);
      expect(beds[b].whisper.split(/\s+/).filter((w) => w.length > 3).length, `${b}: ${beds[b].whisper}`).toBe(0);
    }
  });

  it('every conditioned clip was mixed as its plan says (the report), its clip in clips.json', () => {
    const report = JSON.parse(readFileSync(join(SCRIPTS, 'tts/report.json'), 'utf8')) as { items: Record<string, { cond?: string; condWer?: number; src: string }> };
    const src = JSON.parse(readFileSync(join(SCRIPTS, 'kikimimi-clips.src.json'), 'utf8')) as Record<string, string>;
    for (const it of BANK.flatMap(clipItems)) {
      if (!CLIPS[it.id]) continue; // not voiced yet (a gated pack)
      const cond = condOf(it), row = report.items[it.id];
      expect(row?.src, it.id).toBe(src[it.id]);
      expect(row?.cond, it.id).toBe(cond ? condPlan(cond).key : undefined);
      if (cond) expect(row.condWer, it.id).toBeTypeOf('number');
    }
  });
});
