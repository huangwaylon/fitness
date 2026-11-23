// The maps' shared shapes (docs/design.md "Maps"): what a map shows, the location dot's state and its fix. Pure.

/** What a drawn map shows ('stub': drawOff(), no map made; 'loading' until the style and its first tiles are in;
 *  'offline': drawn, no basemap tile came; 'failed': the chunk or WebGL didn't come; 'lost': the WebGL context gone). */
export type MapMode = 'stub' | 'loading' | 'ready' | 'offline' | 'failed' | 'lost';

/** The location dot: off (never asked), asking, on (a fix shown), denied, unavailable (no fix / no API). */
export type LocState = 'off' | 'asking' | 'on' | 'denied' | 'unavailable';

/** A position fix: where, and its accuracy (m). */
export interface Fix { lon: number; lat: number; acc: number }
