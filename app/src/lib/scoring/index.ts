// Kept only for the two components that still import date helpers from here (kiroku/WeightChart, kiroku/BellsLog);
// new code imports `#lib/time/dates.ts` directly. Delete once they do.
export { addDays, weekKeyOf } from '#lib/time/dates.ts';
