declare global {
  namespace App {
    interface Locals {
      /** Set by hooks.server.ts from the session cookie or bearer token. */
      person: import('#lib/types.ts').PersonId | null;
      deviceId: number | null;
    }
  }
}
export {};
