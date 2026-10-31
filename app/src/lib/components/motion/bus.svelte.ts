// The island event bus (design.md "Motion"). Pages call `emit()` after a store action resolves; the
// island scene listens and plays the matching reaction. Diff events (partner data, fruit
// ripening, a received high-five) are detected inside the scene from the `view` prop instead.
//   import { emit } from '#lib/components/motion/bus.svelte.ts';
//   emit('highfive-sent');
export type IslandEvent =
  | 'open' | 'highfive-sent' | 'highfive-received' | 'sync-error'
  /** Dev gallery only: play a catalogue reaction by id (`detail` = 'R1'…'R19'), or force an event. */
  | 'dev:react' | 'dev:balloon' | 'dev:fireworks';

type Handler = (detail?: string) => void;
const handlers = new Map<IslandEvent, Set<Handler>>();

export function emit(event: IslandEvent, detail?: string): void {
  for (const h of handlers.get(event) ?? []) {
    try {
      h(detail);
    } catch (e) {
      console.error('[island bus]', event, e);
    }
  }
}

/** Subscribe; returns the unsubscribe function. */
export function on(event: IslandEvent, h: Handler): () => void {
  let set = handlers.get(event);
  if (!set) handlers.set(event, (set = new Set()));
  set.add(h);
  return () => set.delete(h);
}
