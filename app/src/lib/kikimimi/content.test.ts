// The listening content (app/content/listen/*.yaml, content/listen/README.md, docs/curriculum-wave2.md §3.4): every
// file passes listen.ts's checker (the README's rules, the Japanese help, the US-only lint), as compile.ts requires;
// the checker catches what it's for; the kinds' clip ids and the clips the audio script speaks.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { oneClipBank, readListen } from './compile.ts';
import clipsJson from './clips.json' with { type: 'json' };
import { BUILD_V } from './games/versions.ts';
import { checkListen, checkListenAll, listenClipIds, listenClipItems, listenPart, notUs, type ListenItem, type ListenPart } from './listen.ts';
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
  const tile = { kind: 'tile', id: 'x', speaker: 'audie', en: 'I told him.', tts: "I told 'im.", ja: 'x', tiles: ['I', 'told', 'him'], decoys: ['them'], note: 'x', tags };

  it('catches the mistakes it is for', () => {
    const msg = bad([{ ...tile, speaker: 'nobody', en: 'It is 5.', tts: 'It is 5.', tiles: ['It', 'is'], decoys: ['It'], note: 'あ'.repeat(41), tags: { ...tags, seed: 2 } }]);
    for (const want of ['roster', 'without digits', '41 字', 'tags.seed', 'tiles: 3-12', 'decoy "It"']) expect(msg).toContain(want);
    expect(bad([tile])).toBe('');
  });

  it('US English only (wave 2 §3.4), accent exposure aside', () => {
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
    const call = (FILES.find((f) => f.file.includes('-call'))!.raw as { items: object[] }).items[0];
    const memo = bad([call], { game: 'call', seeds: [14], cast: { me: 'us-m3' }, status: 'voiced' });
    for (const want of ['ctx is needed', 'memo 0: why is needed', 'slot 0: cja is needed']) expect(memo).toContain(want);
  });

  it('a derived tile plays its bank item (clip): its en, no speaker or tts of its own', () => {
    const bank = new Map([['n1-x', { en: 'I told him.', speaker: 'audie' as const }]]);
    const { speaker: _, tts: __, ...derived } = tile;
    const check = (it: object) => checkListen({ file: 'x-bad.yaml', raw: { schema: 1, unit: 'x-bad', game: 'tile', stage: 2, track: 'life', seeds: [1], features: { primary: 'gonna' }, cando: 'x', status: 'draft', items: [it] } }, bank);
    expect(check({ ...derived, clip: 'n1-x' })).toEqual([]);
    expect(check({ ...derived, clip: 'n1-y' }).join()).toContain('no voiced bank item');
    expect(check({ ...tile, clip: 'n1-x' }).join()).toContain('no speaker, no tts');
    const it = { ...derived, clip: 'n1-x' } as unknown as ListenItem;
    expect(listenClipIds(it)).toEqual(['n1-x']);
    expect(listenClipItems({ stage: 2, items: [it] })).toEqual([]);
    expect(listenPart({ unit: 'x', game: 'tile', stage: 2, status: 'draft', cando: 'x', items: [it] }, bank).items[0]).toMatchObject({ clip: 'n1-x', speaker: 'audie' });
  });

  it('clip ids: a tile its id, a call or a たちぎき one per line; the audio script speaks each in its voice', () => {
    for (const { raw } of FILES) {
      const u = raw as { stage: number; cast?: Record<string, string>; items: ListenItem[] };
      const spoken = listenClipItems(raw);
      // a derived tile (`clip`) plays its bank item's clip: nothing of its own to speak
      expect(spoken.map((c) => c.id)).toEqual(u.items.filter((it) => it.kind !== 'tile' || !it.clip).flatMap(listenClipIds));
      for (const c of spoken) {
        expect(c.lv).toBe(u.stage + 1);
        expect(c.cast).toMatch(/^us-/);
      }
      for (const it of u.items) if (it.kind !== 'tile') expect(listenClipIds(it)).toEqual(it.lines.map((_, n) => `${it.id}-${n + 1}`));
      const me = u.items.flatMap((it) => (it.kind === 'call' ? it.lines.map((l, n) => [l.who, `${it.id}-${n + 1}`]) : [])).find(([w]) => w === 'me');
      if (me) expect(spoken.find((c) => c.id === me[1])!.cast).toBe(u.cast!.me);
    }
  });

  it('a part keeps what is shown, not the engine text, and each clip id', () => {
    for (const { raw } of FILES) {
      const p = listenPart(raw, new Map(BANK.map((it) => [it.id, it])));
      expect(JSON.stringify(p)).not.toContain('"tts"');
      expect(p.items.length).toBe((raw as { items: unknown[] }).items.length);
      for (const it of p.items) expect(it.kind === 'tile' ? [it.clip] : it.lines.map((l) => l.clip)).toEqual(listenClipIds(it));
    }
  });

  it('compiled (levels/): a part per file, its index lines, its game\'s cv once the registry has the game', () => {
    for (const { raw } of FILES) {
      const u = raw as ListenPart;
      const part = JSON.parse(readFileSync(new URL(`./levels/parts/${u.unit}.json`, import.meta.url), 'utf8')) as { listen: ListenPart };
      expect(part.listen).toEqual(listenPart(raw, new Map(BANK.map((it) => [it.id, it]))));
      expect(INDEX.listen[u.unit]).toEqual([u.game, u.stage, u.status]);
      expect(INDEX.units[u.unit]).toMatchObject({ parts: [u.unit], n: u.items.length });
      expect(INDEX.games[`${u.game}:${u.unit}`] !== undefined).toBe(BUILD_V[u.game] !== undefined);
    }
  });
});
