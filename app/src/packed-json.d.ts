// A table imported packed by its keys (vite.config.ts packed-keys, lib/packedKeys.ts): it unpacks itself, the same table (the names'; another's cast).
declare module '*.json?packed' {
  const table: Record<string, string>;
  export default table;
}
