// The clips outside a game's questions (clipPlayer.svelte.ts follow): silence on entering idle, a lobby or the results,
// and a replay there (a review row's ▶︎, まるごと's 「通しで もう一度」, the lobby's 🔊) left to play through the 3 s
// refreshes after it (review 5 P1-1: each refresh stopped it at ~2 s).
import { describe, expect, it, vi } from 'vitest';
const sounding = new Set<string>();
vi.mock('#lib/sound/sound.svelte.ts', () => ({
  loadVoice: async () => null,
  playVoice: (b: { id: string }) => (sounding.add(b.id), { stop: () => sounding.delete(b.id) })
}));
const fetched = vi.hoisted(() => [] as string[][]);
vi.mock('./packs.ts', () => ({ prefetchClips: (ids: string[]) => void fetched.push(ids), voiceClip: async (id: string) => ({ id, duration: 3 }) }));
vi.mock('./scene/stage.ts', () => ({ preloadStage: () => {} }));
import type { Item } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { ClipPlayer } from './clipPlayer.svelte.ts';

const it1 = { id: 'q1', lv: 1 } as unknown as Item;
const view = (phase: QuizView['phase'], g: string | null = 'g1') => ({ phase, g, i: -1 }) as unknown as QuizView;

describe('ClipPlayer outside the questions', () => {
  it('a results replay keeps playing through the refreshes; a new rest phase stops it', async () => {
    const p = new ClipPlayer(() => 0, () => -1);
    p.follow(view('results'), [it1], 0, () => false);
    await p.playNow(it1, -1, false);
    expect([...sounding]).toEqual(['q1']);
    for (let k = 0; k < 3; k++) p.follow(view('results'), [it1], 3000 * k, () => false);
    expect([...sounding]).toEqual(['q1']);
    p.follow(view('idle', null), [], 9000, () => false);
    expect([...sounding]).toEqual([]);
  });
});

describe('ClipPlayer: the deck\'s packs ahead', () => {
  it('a game in sight in the lobby: the first question\'s only; the countdown the rest, once; a lobby not in sight none', () => {
    fetched.length = 0;
    const items = ['q1', 'q2', 'q3'].map((id) => ({ id, lv: 1 }) as unknown as Item);
    const at = (phase: QuizView['phase']) => ({ phase, g: 'g1', gm: 'quiz', seed: 1, o: 0, i: -1, speaks: false }) as unknown as QuizView;
    const p = new ClipPlayer(() => 0, () => -1);
    p.follow(at('lobby'), items, 0, () => false, false);
    expect(fetched).toEqual([]);
    for (let k = 0; k < 3; k++) p.follow(at('lobby'), items, 3000 * k, () => false, true);
    expect(fetched).toEqual([['q1']]);
    for (const ph of ['countdown', 'countdown', 'lead'] as const) p.follow(at(ph), items, 9000, () => false, true);
    expect(fetched).toEqual([['q1'], ['q1', 'q2', 'q3']]);
  });
});
