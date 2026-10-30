// A treat's picture (ADR 0022): official NH item art for the five defaults (static/art/items); an item someone added
// shows the bag of bells.
const ART: Record<string, string> = {
  snack: 'items/snack',
  cafe: 'items/cafe',
  dinner: 'items/dinner',
  want: 'items/want',
  trip: 'items/trip'
};

/** The art key for a treat (its own, or the bag of bells). */
export const itemArt = (id: string): string => ART[id] ?? 'money/bells';
