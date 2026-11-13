// Every test file: the Workers runtime's DurableObject base class, as the object sees it (ctx and env kept), so src/bot.ts
// loads on Node (gym/'s pattern, once for all files).
import { vi } from 'vitest';

vi.mock('cloudflare:workers', () => ({
  DurableObject: class {
    ctx: unknown;
    env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  }
}));
