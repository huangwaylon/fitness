// The island's seeded day: everything a phone shows without syncing (finds, weeds, weather, visitors, showers, eggs)
// derives from the Tokyo date, a stream name and the island's seed, so both phones agree (the record's wet days too:
// contract/wet.ts, where they live).
export { ISLAND_SEED, dayRand } from '#lib/contract/wet.ts';
