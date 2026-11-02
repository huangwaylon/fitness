// The bulletin board on this phone (docs/board.md): the posts as the record keeps them (the model's `board` rows and
// this phone's queued ones, folded by the record's rules: contract/board.ts boardFold), who wrote each (their villager
// name and head), what I may do with each, my changes (each one `board` event, sent at once: the record's notice brings
// it to every open phone), and the 「！」: a post by someone else changed since I last opened the board.
//   board.posts                 newest first (≤ BOARD_MAX)
//   board.write(t) / edit(id, t) / remove(id)
//   board.mayEdit(p) / mayRemove(p)
//   board.unseen / board.seen() the 「！」, and clearing it
import { boardFold, boardMayWrite, boardPosts, cleanText, newPostId, type Post } from '#lib/contract/board.ts';
import { week } from '#lib/store/week.svelte.ts';
import { world } from '#lib/store/world.svelte.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { resolveLook } from '#lib/villagers/look.ts';
import { artUrl, villagerArt } from '#lib/art.ts';
import type { Who } from '#lib/types.ts';

class BoardPosts {
  /** Bumped when the seen mark moves. */
  #seenRev = $state(0);
  #last = 0;

  /** Who I am (the guest's phone: G). */
  get me(): Who {
    return week.view?.viewer ?? 'A';
  }

  /** The posts, newest first. */
  get posts(): Post[] {
    const s = week.model?.state;
    return s ? boardPosts(boardFold(s.board).values()) : [];
  }

  /** A post's author as the board shows them: their villager's name, and their head's image (null: none). */
  author(who: Who): { name: string; icon: string | null } {
    const v = week.view;
    const name = who === 'G' ? (v?.guest.villagerName ?? '') : (v?.people[who]?.villagerName ?? '');
    const pick = who === 'G' ? v?.guest.villager : v?.people[who]?.villager;
    const look = resolveLook({ villager: pick ?? null, person: who });
    return { name, icon: artUrl(villagerArt(look.id, true)) };
  }

  mayEdit(p: Post): boolean {
    return boardMayWrite(this.me, { id: p.id, at: p.at + 1, p: p.p, t: p.t }, { ...p });
  }
  mayRemove(p: Post): boolean {
    return boardMayWrite(this.me, { id: p.id, at: p.at + 1, rm: true }, { ...p });
  }

  /** A change's time: the relay's clock, never twice the same, after the post it changes. */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }

  /** Post a new note: false when there's nothing to post (or the phone can't send). */
  write(raw: string): boolean {
    const t = cleanText(raw);
    if (!t) return false;
    const at = this.#now();
    const ok = week.send('board', { id: newPostId(at), at, p: at, t }).ok;
    if (ok) this.seen();
    return ok;
  }

  /** Change my note's text (the whole of it). */
  edit(id: string, raw: string): boolean {
    const p = this.posts.find((x) => x.id === id), t = cleanText(raw);
    if (!p || !t || !this.mayEdit(p)) return false;
    if (t === p.t) return true;
    const ok = week.send('board', { id, at: this.#now(p.at), p: p.p, t }).ok;
    if (ok) this.seen();
    return ok;
  }

  /** Take a note down (final). */
  remove(id: string): boolean {
    const p = this.posts.find((x) => x.id === id);
    if (!p || !this.mayRemove(p)) return false;
    return week.send('board', { id, at: this.#now(p.at), rm: true }).ok;
  }

  #key(): string {
    return week.demo ? DEMO.boardSeen : LIVE.boardSeen;
  }
  #seenAt(): number {
    void this.#seenRev;
    const m = readJson<Partial<Record<Who, number>>>(localKV(), this.#key());
    return typeof m?.[this.me] === 'number' ? m[this.me]! : 0;
  }

  /** Someone else's post is new or changed since I last opened the board (a first visit: any of theirs). */
  get unseen(): boolean {
    const seen = this.#seenAt(), me = this.me;
    return this.posts.some((p) => p.who !== me && p.at > seen);
  }

  /** I've seen the board as it is now. */
  seen(): void {
    const newest = this.posts.reduce((n, p) => Math.max(n, p.at), 0);
    if (newest <= this.#seenAt()) return;
    const m = readJson<Partial<Record<Who, number>>>(localKV(), this.#key()) ?? {};
    writeJson(localKV(), this.#key(), { ...m, [this.me]: newest });
    this.#seenRev++;
  }
}

/** The bulletin board's posts: one per phone. */
export const board = new BoardPosts();
