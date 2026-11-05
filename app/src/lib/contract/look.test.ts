// The look and the コーデ (contract/look.ts): the defaults are the signed-off outfits, what the record takes, and how a
// phone reads a look it doesn't fully know (never a crash: いつもの's part).
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LOOKS, defaultLook, isPlayerLook, LOOK_LIMITS, lookName, lookPrefOk, newLookId, partOk, playerOf, readPlayerLook,
  readSavedLooks, resolveLook, sameLook, savedLooksOk, usePartTable, type PlayerLook, type SavedLook
} from './look.ts';

const outfit = (n: string) => JSON.parse(readFileSync(new URL(`../../../design/avatar/render/outfits/${n}.json`, import.meta.url), 'utf8'));
const A = DEFAULT_LOOKS.A;
const B = DEFAULT_LOOKS.B;

afterEach(() => usePartTable(null));

describe('いつもの (DEFAULT_LOOKS)', () => {
  it('A and B are the signed-off outfits (design/avatar/render/outfits a.json, b.json)', () => {
    for (const [look, o] of [[A, outfit('a')], [B, outfit('b')]] as const) {
      expect(look).toMatchObject({
        hair: o.hair, hairColor: o.hairColor, eye: o.eye, eyeColor: o.eyeColor, mouth: o.mouth, mouthFrame: o.mouthFrame,
        skin: o.skin, cheek: o.cheek, nose: o.nose, top: o.top.tex, bottom: o.bottom.tex, socks: o.socks, shoes: o.shoes,
        glasses: o.glasses ?? null
      });
    }
    // B's bow stands in for the scrunchie (an `extra` in the harness's outfit)
    expect(B.ornament).toBe(outfit('b').extra[0].folder);
    expect(A.ornament).toBeNull();
  });

  it('both are whole looks; the guest’s いつもの is its villager', () => {
    expect(isPlayerLook(A) && isPlayerLook(B)).toBe(true);
    expect(defaultLook('A')).toEqual({ kind: 'player', ...A });
    expect(defaultLook('G')).toEqual({ kind: 'villager', villager: null });
  });
});

describe('what the record takes', () => {
  it('a part only of its slot, well formed, at most 40 characters', () => {
    expect(partOk('hair', 'PlayerHair24')).toBe(true);
    expect(partOk('hair', 'PlayerHair')).toBe(false);
    expect(partOk('hair', 'TopsTexTopOuterLAran3')).toBe(false);
    expect(partOk('top', 'TopsTexTopOuterLAran3')).toBe(true);
    expect(partOk('top', 'TopsTex Top')).toBe(false);
    expect(partOk('shoes', `Shoes${'x'.repeat(35)}`)).toBe(true);
    expect(partOk('shoes', `Shoes${'x'.repeat(36)}`)).toBe(false);
    expect(partOk('glasses', 42)).toBe(false);
  });

  it('a whole look: every field, colours #rrggbb, no other key, a one-piece without bottoms', () => {
    expect(isPlayerLook({ ...A, glasses: null, socks: null })).toBe(true);
    expect(isPlayerLook({ ...A, hat: 'CapHatKnitcap0' })).toBe(true);
    expect(isPlayerLook({ ...A, hat: null })).toBe(true);
    expect(isPlayerLook({ ...A, v: 2 })).toBe(false);
    expect(isPlayerLook({ ...A, hairColor: 'red' })).toBe(false);
    expect(isPlayerLook({ ...A, skin: '#fff' })).toBe(false);
    expect(isPlayerLook({ ...A, cheek: 3 })).toBe(false);
    expect(isPlayerLook({ ...A, mouthFrame: 9 })).toBe(false);
    expect(isPlayerLook({ ...A, mouthFrame: 1.5 })).toBe(false);
    expect(isPlayerLook({ ...A, extra: 1 })).toBe(false);
    const { hair: _h, ...noHair } = A;
    expect(isPlayerLook(noHair)).toBe(false);
    expect(isPlayerLook({ ...A, hair: null })).toBe(false);
    expect(isPlayerLook({ ...A, top: 'TopsTexOnepieceAlineHLinen0' })).toBe(false);
    expect(isPlayerLook({ ...A, top: 'TopsTexOnepieceAlineHLinen0', bottom: null })).toBe(true);
  });

  it('the look pref: null, a villager, or a whole player', () => {
    expect(lookPrefOk(null)).toBe(true);
    expect(lookPrefOk({ kind: 'villager' })).toBe(true);
    expect(lookPrefOk({ kind: 'villager', villager: 'goldie' })).toBe(false);
    expect(lookPrefOk({ kind: 'player', look: B })).toBe(true);
    expect(lookPrefOk({ kind: 'player', look: { ...B, eye: 'x' } })).toBe(false);
    expect(lookPrefOk({ kind: 'player', look: B, x: 1 })).toBe(false);
    expect(lookPrefOk({ kind: 'alien' })).toBe(false);
    expect(lookPrefOk('goldie')).toBe(false);
  });

  it('names: trimmed, 1–12 characters (code points), no line breaks', () => {
    expect(lookName('  おでかけ ')).toBe('おでかけ');
    expect(lookName('コーデ 12345678')).toBe('コーデ 12345678');
    expect(lookName('コーデ 123456789')).toBeNull();
    expect(lookName('あいうえおかきくけこさし')).toBe('あいうえおかきくけこさし');
    expect(lookName('🌸'.repeat(12))).toBe('🌸'.repeat(12));
    expect(lookName('   ')).toBeNull();
    expect(lookName('a\nb')).toBeNull();
    expect(lookName(3)).toBeNull();
  });

  it('saved looks: at most 20, each whole with an 8-character id and a kept name, ids unique', () => {
    const s = (id: string, name = 'コーデ', look: PlayerLook = A): SavedLook => ({ id, name, look });
    expect(savedLooksOk([])).toBe(true);
    expect(savedLooksOk([s('abcd1234'), s('abcd1235', 'x', B)])).toBe(true);
    expect(savedLooksOk([s('abcd1234'), s('abcd1234')])).toBe(false);
    expect(savedLooksOk([s('ABCD1234')])).toBe(false);
    expect(savedLooksOk([s('abcd123')])).toBe(false);
    expect(savedLooksOk([s('abcd1234', ' x')])).toBe(false);
    expect(savedLooksOk([s('abcd1234', '')])).toBe(false);
    expect(savedLooksOk([{ ...s('abcd1234'), at: 1 }])).toBe(false);
    expect(savedLooksOk([s('abcd1234', 'x', { ...A, top: 'Shoes0' })])).toBe(false);
    expect(savedLooksOk(Array.from({ length: 20 }, (_, i) => s(`abcd${String(i).padStart(4, '0')}`)))).toBe(true);
    expect(savedLooksOk(Array.from({ length: 21 }, (_, i) => s(`abcd${String(i).padStart(4, '0')}`)))).toBe(false);
    expect(savedLooksOk({})).toBe(false);
  });

  it('20 of the longest コーデ fit an event (the record’s 20,000 characters)', () => {
    const long = (prefix: string) => prefix + 'x'.repeat(LOOK_LIMITS.partMaxChars - prefix.length);
    const look: PlayerLook = {
      ...A, hair: long('PlayerHair'), eye: long('PlayerEye'), mouth: long('PlayerMouth'), top: long('TopsTexTop'), bottom: long('BottomsTex'),
      socks: long('SocksTex'), shoes: long('Shoes'), glasses: long('AccessoryGlass'), ornament: long('CapOrnament'), hat: long('CapHat')
    };
    const list = Array.from({ length: 20 }, (_, i) => ({ id: `abcd${String(i).padStart(4, '0')}`, name: '🌸'.repeat(12), look }));
    expect(savedLooksOk(list)).toBe(true);
    expect(JSON.stringify({ key: 'savedLooks', value: list }).length).toBeLessThan(20_000);
  });

  it('with a part table set, only its ids', () => {
    usePartTable(new Set(['PlayerHair24', 'PlayerEye02']));
    expect(partOk('hair', 'PlayerHair24')).toBe(true);
    expect(partOk('hair', 'PlayerHair12')).toBe(false);
    usePartTable(null);
    expect(partOk('hair', 'PlayerHair12')).toBe(true);
  });
});

describe('how a phone reads a look (never a crash)', () => {
  it('no look pref, an unreadable one: いつもの', () => {
    expect(resolveLook({}, 'A')).toEqual({ kind: 'player', ...A });
    expect(resolveLook(undefined, 'B')).toEqual({ kind: 'player', ...B });
    expect(resolveLook({ look: 'junk' }, 'B')).toEqual({ kind: 'player', ...B });
    expect(resolveLook({ look: { kind: 'player' } }, 'A')).toEqual({ kind: 'player', ...A });
    expect(resolveLook({ villager: 'goldie' }, 'G')).toEqual({ kind: 'villager', villager: null });
  });

  it('a villager: the villager pref’s (null: the person’s default villager)', () => {
    expect(resolveLook({ look: { kind: 'villager' }, villager: 'goldie' }, 'A')).toEqual({ kind: 'villager', villager: 'goldie' });
    expect(resolveLook({ look: { kind: 'villager' } }, 'B')).toEqual({ kind: 'villager', villager: null });
  });

  it('a player: as worn', () => {
    expect(resolveLook({ look: { kind: 'player', look: B } }, 'A')).toEqual({ kind: 'player', ...B });
    expect(resolveLook({ look: { kind: 'player', look: A } }, 'G')).toEqual({ kind: 'player', ...A });
  });

  it('a part it doesn’t know, a broken field: いつもの’s for that field alone', () => {
    const odd = { ...B, hair: 'PlayerHairFromTheFuture', top: 'Nope', eyeColor: 'blue', cheek: 9, glasses: 'AccessoryGlassCircle3', future: 1 };
    usePartTable(new Set(Object.values(A).concat(Object.values(B), 'AccessoryGlassCircle3').filter((x): x is string => typeof x === 'string')));
    expect(resolveLook({ look: { kind: 'player', look: odd } }, 'B')).toEqual({ kind: 'player', ...B, glasses: 'AccessoryGlassCircle3' });
    // A's いつもの fills A's
    expect(readPlayerLook({ hair: 'PlayerHair12' }, A)).toEqual({ ...A, hair: 'PlayerHair12' });
  });

  it('a one-piece clears the bottoms', () => {
    expect(readPlayerLook({ ...B, top: 'TopsTexOnepieceAlineHLinen0' }, B)).toEqual({ ...B, top: 'TopsTexOnepieceAlineHLinen0', bottom: null });
  });

  it('saved looks: the readable ones, at most 20, ids unique, each look read leniently', () => {
    const ok = { id: 'abcd1234', name: ' あ ', look: { ...A, hair: 'Unknown' } };
    const list = [ok, { ...ok }, { id: 'bad', name: 'x', look: A }, { id: 'abcd1235', name: '', look: A }, null, { id: 'abcd1236', name: 'b', look: 3 }];
    expect(readSavedLooks(list, 'A')).toEqual([{ id: 'abcd1234', name: 'あ', look: A }]);
    expect(readSavedLooks(Array.from({ length: 25 }, (_, i) => ({ id: `abcd${String(i).padStart(4, '0')}`, name: 'x', look: B })), 'B')).toHaveLength(20);
    expect(readSavedLooks('junk', 'A')).toEqual([]);
  });
});

describe('helpers', () => {
  it('playerOf: a player’s parts, a villager’s いつもの player (A’s for the guest)', () => {
    expect(playerOf({ kind: 'player', ...B }, 'A')).toEqual(B);
    expect(playerOf({ kind: 'villager', villager: null }, 'B')).toEqual(B);
    expect(playerOf({ kind: 'villager', villager: 'judy' }, 'G')).toEqual(A);
  });

  it('sameLook: field by field (an absent hat is none)', () => {
    expect(sameLook(A, { ...A })).toBe(true);
    expect(sameLook(A, { ...A, hat: null })).toBe(true);
    expect(sameLook(A, { ...A, mouthFrame: 2 })).toBe(false);
  });

  it('newLookId: 8 lowercase letters and digits', () => {
    expect(newLookId()).toMatch(/^[a-z0-9]{8}$/);
    expect(newLookId(() => 0)).toBe('aaaaaaaa');
  });
});
