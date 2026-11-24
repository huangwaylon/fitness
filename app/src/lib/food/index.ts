// The meal log's food catalog (food-data/'s build in static/food/, scripts/food-data.ts): load it, search it, and
// turn an item and a portion into what an entry keeps. Import it lazily (the food sheet's chunk), never from the economy.
export { janItem, loadFoodDb, NewerFoodData } from './load.ts';
export { credits, itemById, findFoods, nearFoods, variantsOf, verifyOf, type FoodDb } from './db.ts';
export { amountCheck, portionCheck } from './portionCheck.ts';
export { entryKcal, g1, itemsKcal, nutrientsFor, portionsOf, toSnap, unitOf } from './nutrition.ts';
export type { Credit, Item, Portion } from './types.ts';
