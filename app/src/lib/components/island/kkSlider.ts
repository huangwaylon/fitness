// K.K. Slider on the island (docs/design.md "K.K. Slider"), the pure part: he lives here now, on his stool (the
// layout's `kk-stool` piece, `kk-slider`: placed and moved in the editor, layout/catalog.ts), every day. What he's up to
// goes by the Tokyo clock, as NH's week does:
//   show    Saturday 18:00–24:00, NH's concert: his greeting asks for a request, the villagers sway to his song, ♪ off
//           his guitar while he plays, his sign-off till next Saturday
//   day     the rest of his waking hours: he strums quietly to himself (a nod to the beat now and then, no sound); a tap
//           is a chat and, with ミュージック on, a song on request too (NH's K.K. only plays on Saturdays; here he's a
//           resident, so he'll play one any time he's up)
//   asleep  00:00–06:00 (after the show too): nodded off on his stool, zzz; a tap is a sleepy mumble, no song
// island/KKSlider.svelte draws and plays him; the 3D island poses NH's model of him sitting on the stool (the villagers'
// code, slot `kk`, the director's actor `kk`).
import { pickOne } from '#lib/random.ts';
import type { EmoteIcon } from '#lib/art.ts';
import { objMid, type Layout } from '#lib/layout/model.ts';
import { yawOf } from '#lib/layout/nav.ts';
import { anchorsOf, shapeOf } from '../villager3d/seats3d.ts';
import MODELS from './models.json' with { type: 'json' };

/** His piece's kind and its id on the default layout (one to an island). */
const KK_KIND = 'kk-stool';
const KK_ID = 'kk-slider';
/** The stool's height (u): the log stool's (catalog.ts log-stool), its seat where he sits. */
export const KK_STOOL_H = 19;
/** Its seat's top (u over the ground): the log stool's own seat (villager3d/seats3d.json) at that height. */
export const KK_SEAT = ((mu) => anchorsOf(shapeOf('island', 'log-stool'), { x: 0, z: 0, y: 0, yaw: 0, s: KK_STOOL_H / mu })[0]?.y ?? KK_STOOL_H * 0.66)(
  (MODELS as unknown as Record<string, { mu: [number, number] }>)['deco/log-stool']?.mu[1] ?? 6.3
);

export type KKMode = 'show' | 'day' | 'asleep';
export const KK_MODES: readonly KKMode[] = ['show', 'day', 'asleep'];

/** What he's up to at a Tokyo hour on a weekday (0 Sunday … 6 Saturday). */
export function kkMode(weekday: number, hour: number): KKMode {
  if (hour < 6) return 'asleep';
  return weekday === 6 && hour >= 18 ? 'show' : 'day';
}

/** Where he sits: his stool's middle on the layout (world u), its facing and the yaw he faces with it (three's, as the
 *  stool's model: nav.ts yawOf), or null (an island with no stool: never, it's never deleted, but a layout may lack it). */
export function kkSpot(layout: Layout): { x: number; z: number; f: number; yaw: number; id: string } | null {
  const o = layout.objects.get(KK_ID) ?? [...layout.objects.values()].find((p) => p.k === KK_KIND);
  if (!o) return null;
  const [x, z] = objMid(layout, o);
  return { x, z, f: o.f, yaw: yawOf(o), id: o.id };
}

/** What he does on idle life's beat. */
export type KKAct = 'strum' | 'emote' | 'snore';
/** His emotes now and then (a note, glee, a sparkle at the show). */
const EMOTES: Record<KKMode, readonly EmoteIcon[]> = { show: ['mark-note', 'glee', 'mark-sparkle'], day: ['mark-note', 'glee'], asleep: [] };

/** One beat: asleep a snore (a twitch and zzz), else mostly a strum (a nod to the beat, ♪ at the show or while he
 *  plays: he sits facing his stool's way, so no looks about) or an emote; nothing while he speaks. */
export function kkAct(mode: KKMode, s: { speaking: boolean; playing: boolean }, rnd: () => number): KKAct | null {
  if (s.speaking) return null;
  if (mode === 'asleep') return 'snore';
  if (s.playing) return 'strum';
  return rnd() < 0.65 ? 'strum' : 'emote';
}

/** One of his emotes for the mode, never the last one again. */
export function kkEmote(mode: KKMode, rnd: () => number, last?: EmoteIcon | null): EmoteIcon | null {
  const list = EMOTES[mode].filter((e) => e !== last);
  return list.length ? pickOne(list, rnd) : null;
}

/** His line on a tap (an i18n key) with ミュージック on, by the mode: the show's greeting asks for a request, by day a
 *  chat that offers one (no songs yet: he's tuning up); asleep a mumble. `asks`: the line comes with リクエスト /
 *  おまかせ. (With the music off he only chats: his introduction, then his lines.) */
export function kkGreeting(mode: KKMode, songs: boolean): { key: string; asks: boolean } {
  if (mode === 'asleep') return { key: 'chat.sp.kk-slider.asleep', asks: false };
  if (!songs) return { key: 'chat.sp.kk-slider.tuning', asks: false };
  return { key: mode === 'show' ? 'chat.sp.kk-slider.hello' : 'chat.sp.kk-slider.dayHello', asks: true };
}
