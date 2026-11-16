// English Study's library index: a module the build makes from clips/index.ts (vite.config.ts english-data).
declare module '*?english-index' {
  const index: readonly import('$lib/english/catalog.ts').ClipMeta[];
  export default index;
}
