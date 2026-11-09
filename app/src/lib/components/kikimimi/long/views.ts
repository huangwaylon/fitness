// まるごと 聞く's own pages (views.ts): its round (the piece played whole, then a question a round) and its results (the
// questions' review, the transcript with each line to hear again, the dictation near my misses). Its lobby is the
// quiz's (its place, ほし: its content's one).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./LongPlay.svelte'),
  results: () => import('./LongResults.svelte')
};
