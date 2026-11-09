// Whether the phone is online (`navigator.onLine`), reactive: `online.current` (one listener pair for every reader).
import { createSubscriber } from 'svelte/reactivity';

const subscribe = createSubscriber((update) => {
  addEventListener('online', update);
  addEventListener('offline', update);
  return () => (removeEventListener('online', update), removeEventListener('offline', update));
});

export const online = {
  get current(): boolean {
    if (typeof navigator === 'undefined') return true;
    subscribe();
    return navigator.onLine;
  }
};
