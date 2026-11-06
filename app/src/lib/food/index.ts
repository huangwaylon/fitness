// The meal log's food catalog (food-data/'s build in static/food/, scripts/food-data.ts): load it, search it, and
// turn an item and a portion into what an entry keeps. Import it lazily (the food sheet's chunk), never from the economy.
export { loadFoodDb } from './load.ts';
export { credits, searchFoods, variantsOf, verifyOf, type FoodDb } from './db.ts';
export { nutrientsFor, portionsOf, toSnap } from './nutrition.ts';
export type { Credit, Item, Portion } from './types.ts';
