// A unit's lesson's own pages (views.ts): its round, which plays a recipe-2 card on its listening game's page
// (LessonPlay). Its lobby is the lesson's intro card and its results the quiz's (Results.svelte: the lesson's strip).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./LessonPlay.svelte')
};
