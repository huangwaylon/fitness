// The listening content (app/content/listen/*.yaml, content/listen/README.md, docs/curriculum.md "Authoring pipeline"): every
// file passes listen.ts's checker (the README's rules, the Japanese help, the US-only lint), as compile.ts requires;
// the checker catches what it's for; the kinds' clip ids and the clips the audio script speaks.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { oneClipBank, readListen } from './compile.ts';
import clipsJson from './clips.json' with { type: 'json' };
import { BUILD_V } from './games/versions.ts';
import { asSaid, checkListen, checkListenAll, listenClipIds, listenClipItems, listenPart, notUs, type ListenItem, type ListenPart } from './listen.ts';
import { spokenText } from './speech.ts';
import { INDEX } from './pool.ts';
import { BANK } from './source.ts';

const FILES = readListen();
/** The voiced one-clip bank items a derived tile may name, as the compiler passes them. */
const ONE_CLIP = oneClipBank(clipsJson);

describe('listen content', () => {
  it('has files', () => expect(FILES.length).toBeGreaterThan(0));
  for (const src of FILES) it(`${src.file} is well formed`, () => expect(checkListen(src, ONE_CLIP)).toEqual([]));
  it('ids are unique across files and apart from the bank clips', () => {
    expect(checkListenAll(FILES, ONE_CLIP)).toEqual([]);
    const [src] = FILES, id = (src.raw as { items: { id: string }[] }).items[0].id;
    expect(checkListenAll([src, { ...src, file: 'again.yaml' }]).join()).toContain(`id ${id} is also in`);
    expect(checkListenAll([src], new Map(), new Set([id])).join()).toContain('a bank or unit clip');
  });

  const bad = (items: object[], head: object = {}) => checkListen({ file: 'x-bad.yaml', raw: {
    schema: 1, unit: 'x-bad', game: 'tile', stage: 2, track: 'life', seeds: [1], features: { primary: 'gonna' }, cando: 'x', status: 'draft', ...head, items
  } }).join('\n');
  const tags = { seed: 1, register: 'friend', pragmatic: 'literal', features: ['gonna'] };
  const tile = { kind: 'tile', id: 'x', speaker: 'audie', en: 'I told him.', ja: 'x', tiles: ['I', 'told', 'him'], decoys: ['them'], note: 'x', tags };

  it('catches the mistakes it is for', () => {
    const msg = bad([{ ...tile, speaker: 'nobody', en: 'It is 5.', tts: 'It is 5.', tiles: ['It', 'is'], decoys: ['It'], note: 'あ'.repeat(41), tags: { ...tags, seed: 2 } }]);
    for (const want of ['roster', 'without digits', '41 字', 'tags.seed', 'tiles: 3-12', 'decoy "It"']) expect(msg).toContain(want);
    expect(bad([tile])).toBe('');
  });

  it('US English only (curriculum.md "Authoring pipeline"), accent exposure aside', () => {
    expect(notUs("Cheers for that, mate, see you in a fortnight. I reckon the queue's long.")).toEqual(['mate', 'cheers for thanks', 'queue (line)', 'fortnight', 'reckon']);
    expect(notUs('My neighbour said to realise it, at half nine, by the lift? The flat is big.')).toEqual(['flat (apartment)', 'lift (elevator)', 'half nine', 'UK -our spelling', 'UK -ise spelling']);
    expect(notUs('Cheers! I got a flat tire on the way to a fancy place, so I took the elevator. Raise your glasses!')).toEqual([]);
    expect(bad([{ ...tile, en: 'Thanks, mate.', tts: 'Thanks, mayte.', tiles: ['Thanks', 'mate'] }])).toContain('not US English (mate)');
    expect(bad([{ ...tile, en: 'Thanks, mate.', tts: 'Thanks, mayte.', tiles: ['Thanks', 'mate', 'x'], tags: { ...tags, features: ['accent-exposure'] } }])).not.toContain('not US');
  });

  it('the Japanese help: checked when there, needed past draft', () => {
    const help = bad([{ ...tile, ctx: 'English here', why: 'あ'.repeat(91) }]);
    for (const want of ['ctx: Japanese', 'why: Japanese']) expect(help).toContain(want);
    const past = bad([tile], { status: 'voiced' });
    expect(past).toContain('ctx is needed past draft');
    expect(past).toContain('why is needed past draft');
    expect(bad([{ ...tile, ctx: '友だちと 話している', why: 'him の h が落ちる' }], { status: 'voiced' })).toBe('');
    // a drafted call without its help (ctx, the rounds' why, the slots' cja)
    type Memo = { why?: string; slots: { cja?: string[] }[] };
    const { ctx: _, memo: rounds, ...rest } = (FILES.find((f) => f.file.includes('-call'))!.raw as { items: { ctx?: string; memo: Memo[] }[] }).items[0];
    const call = { ...rest, memo: rounds.map(({ why: __, slots }) => ({ slots: slots.map(({ cja: ___, ...s }) => s) })) };
    const memo = bad([call], { game: 'call', seeds: [14], cast: { me: 'us-m3' }, status: 'voiced' });
    for (const want of ['ctx is needed', 'memo 0: why is needed', 'slot 0: cja is needed']) expect(memo).toContain(want);
  });

  it('a derived tile plays its bank item (clip): its en, no speaker or tts of its own', () => {
    const bank = new Map([['n1-x', { en: 'I told him.', speaker: 'audie' as const }]]);
    const { speaker: _, ...derived } = tile;
    const check = (it: object) => checkListen({ file: 'x-bad.yaml', raw: { schema: 1, unit: 'x-bad', game: 'tile', stage: 2, track: 'life', seeds: [1], features: { primary: 'gonna' }, cando: 'x', status: 'draft', items: [it] } }, bank);
    expect(check({ ...derived, clip: 'n1-x' })).toEqual([]);
    expect(check({ ...derived, clip: 'n1-y' }).join()).toContain('no voiced bank item');
    expect(check({ ...tile, clip: 'n1-x' }).join()).toContain('no speaker, no tts');
    // its en is the bank's as the clip says it (gonna, wanna, gotta, Why'd); every tile heard
    const said = new Map([['n1-g', { en: "I'm going to pass.", tts: "I'm gonna pass.", speaker: 'audie' as const }], ['n1-d', { en: "I don't know.", tts: 'Dunno.', speaker: 'audie' as const }]]);
    const of = (it: object) => checkListen({ file: 'x-bad.yaml', raw: { schema: 1, unit: 'x-bad', game: 'tile', stage: 2, track: 'life', seeds: [1], features: { primary: 'gonna' }, cando: 'x', status: 'draft', items: [it] } }, said).join();
    expect(of({ ...derived, clip: 'n1-g', en: "I'm gonna pass.", tiles: ["I'm", 'gonna', 'pass'], decoys: ['wanna'] })).toBe('');
    expect(of({ ...derived, clip: 'n1-g', en: "I'm going to pass.", tiles: ["I'm", 'going', 'to', 'pass'] })).toContain(`as said: "I'm gonna pass."`);
    expect(of({ ...derived, clip: 'n1-d', en: "I don't know.", tiles: ['I', "don't", 'know'] })).toContain("a tile isn't heard");
    const it = { ...derived, clip: 'n1-x' } as unknown as ListenItem;
    expect(listenClipIds(it)).toEqual(['n1-x']);
    expect(listenClipItems({ stage: 2, items: [it] })).toEqual([]);
    expect(listenPart({ unit: 'x', game: 'tile', stage: 2, status: 'draft', cando: 'x', items: [it] }, bank).items[0]).toMatchObject({ clip: 'n1-x', speaker: 'audie' });
  });

  it('the tile rules (README "tile"): plain tts, sound decoys, plain copy, say glosses the trio only', () => {
    expect(bad([{ ...tile, tts: "I told 'im." }])).toContain("tts respells 'im");
    expect(bad([{ ...tile, tts: 'I told him.' }])).toContain('tts is en');
    expect(bad([{ ...tile, en: 'I told her.', tiles: ['I', 'told', 'her'], tts: 'I tol\' her.' }])).toBe('');
    expect(bad([{ ...tile, decoys: ['eye'] }])).toContain('sounds like a tile');
    expect(bad([{ ...tile, decoys: ['didja'] }])).toContain('respelled form');
    expect(bad([{ ...tile, decoys: ['gonna'] }])).toContain('respelled form');
    expect(bad([{ ...tile, note: '主語が落ちる' }])).toContain('grammar term (主語)');
    expect(bad([{ ...tile, marks: [['say', 'him', "'im"]] }])).toContain('say only glosses');
    expect(bad([{ ...tile, en: "I'm gonna tell him.", tiles: ["I'm", 'gonna', 'tell', 'him'], decoys: ['wanna'], marks: [['say', 'gonna', 'going to']] }])).toBe('');
    expect(bad([{ ...tile, en: 'Hot or iced?', tiles: ['Hot', 'or iced'] }])).toContain('tiles: 3-12');
    expect(bad([{ ...tile, en: 'Is it hot or iced?', tiles: ['Is', 'it', 'hot', 'or iced'] }])).toBe('');
    expect(asSaid('Why did you even tell her?', "Whydja even tell 'er?")).toBe("Why'd you even tell her?");
    expect(asSaid('Are you going to the thing?', "Are ya goin' to the thing?")).toBe('Are you going to the thing?');
    expect(asSaid("Going to rain? I've got to go.", "Gonna rain? I've gotta go.")).toBe("Gonna rain? I've gotta go.");
  });

  it('a stage caps its tiles that say a reduction (S1 20 %, S2 25 %, S3 30 %)', () => {
    const file = (n: number, gonna: number) => ({ file: `s1-cap-${n}.yaml`, raw: { game: 'tile', stage: 2, items: Array.from({ length: n }, (_, k) => ({ ...tile, id: `cap-${n}-${k}`, ...(k < gonna && { en: "I'm gonna go.", tiles: ["I'm", 'gonna', 'go'] }) })) } });
    expect(checkListenAll([file(10, 2)]).filter((m) => m.startsWith('stage'))).toEqual([]);
    expect(checkListenAll([file(10, 3)]).join()).toContain("stage 2's tiles: 3 of 10 say a reduction (cap 20 %)");
  });

  it('a tile’s tone: neutral, soft or firm on an own clip, given to the audio script, never in the part', () => {
    expect(bad([{ ...tile, tone: 'soft' }])).toBe('');
    expect(bad([{ ...tile, tone: 'happy' }])).toContain('tone happy: neutral, soft, firm or nothing');
    const unit = { unit: 'x', game: 'tile', stage: 2, status: 'listened', cando: 'x', items: [{ ...tile, tone: 'firm' }] };
    expect(listenClipItems(unit)[0].tone).toBe('firm');
    expect(JSON.stringify(listenPart(unit, new Map()))).not.toContain('"tone":');
  });

  it('a tile to re-voice is left out of its part; every other own tile clip says its words', () => {
    const it = { ...tile, revoice: true } as unknown as ListenItem;
    expect(listenPart({ unit: 'x', game: 'tile', stage: 2, status: 'listened', cando: 'x', items: [it, tile as unknown as ListenItem] }, new Map()).items).toHaveLength(1);
    const report = JSON.parse(readFileSync(new URL('../../../scripts/tts/report.json', import.meta.url), 'utf8')) as { items: Record<string, { text: string }> };
    for (const { raw } of FILES) {
      const u = raw as { game: string; status: string; items: ListenItem[] };
      if (u.game !== 'tile' || u.status === 'draft') continue;
      const held = new Set(u.items.filter((x) => x.kind === 'tile' && x.revoice).map((x) => x.id));
      for (const c of listenClipItems(raw)) if (!held.has(c.id)) expect(report.items[c.id]?.text, `${c.id}: its clip says other words (revoice: true until it's re-voiced)`).toBe(spokenText(c));
    }
  });

  it('clip ids: a tile its id, a call or a たちぎき one per line; the audio script speaks each in its voice', () => {
    for (const { raw } of FILES) {
      const u = raw as { stage: number; cast?: Record<string, string>; items: ListenItem[] };
      const spoken = listenClipItems(raw);
      // a derived tile (`clip`) plays its bank item's clip, a real long piece's lines are cut from its recording: nothing
      // of their own to speak
      const own = (it: ListenItem) => (it.kind !== 'tile' || !it.clip) && (it.kind !== 'long' || it.source !== 'real');
      expect(spoken.map((c) => c.id)).toEqual(u.items.filter(own).flatMap(listenClipIds));
      for (const c of spoken) {
        expect(c.lv).toBe(u.stage + 1);
        expect(c.cast).toMatch(/^us-/);
      }
      for (const it of u.items) if ('lines' in it) expect(listenClipIds(it)).toEqual(it.lines.map((_, n) => `${it.id}-${n + 1}`));
      const me = u.items.flatMap((it) => (it.kind === 'call' ? it.lines.map((l, n) => [l.who, `${it.id}-${n + 1}`]) : [])).find(([w]) => w === 'me');
      if (me) expect(spoken.find((c) => c.id === me[1])!.cast).toBe(u.cast!.me);
    }
  });

  it('a part keeps what is shown, not the engine text, and each clip id', () => {
    for (const { raw } of FILES) {
      const p = listenPart(raw, new Map(BANK.map((it) => [it.id, it])));
      expect(JSON.stringify(p)).not.toMatch(/"(tts|tone)":/);
      expect(p.items.length).toBe((raw as { items: { revoice?: true }[] }).items.filter((it) => !it.revoice).length);
      for (const it of p.items) if (it.kind !== 'news' && it.kind !== 'weather') expect('lines' in it ? it.lines.map((l) => l.clip) : [it.clip]).toEqual(listenClipIds(it));
    }
  });

  it('compiled (levels/): a part per file, its index lines, its game\'s cv once the registry has the game', () => {
    for (const { raw } of FILES) {
      const u = raw as ListenPart;
      const part = JSON.parse(readFileSync(new URL(`./levels/parts/${u.unit}.json`, import.meta.url), 'utf8')) as { listen: ListenPart };
      expect(part.listen).toEqual(listenPart(raw, new Map(BANK.map((it) => [it.id, it]))));
      expect(INDEX.listen[u.unit]).toEqual([u.game, u.stage, u.status]);
      expect(INDEX.units[u.unit]).toMatchObject({ parts: [u.unit], n: part.listen.items.length });
      expect(INDEX.games[`${u.game}:${u.unit}`] !== undefined).toBe(BUILD_V[u.game] !== undefined);
    }
  });
});
