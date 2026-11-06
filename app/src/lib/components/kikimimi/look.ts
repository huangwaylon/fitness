// ききみみ's small looks (the UI's, not the library's): a domain's icon and tint, a level's mark, a speed as shown.
import { levelRank } from '#lib/kikimimi/bank.ts';
import { isUnitDomain, type UnitDomain } from '#lib/kikimimi/stages.ts';

/** The nine domains and the anchors' `glue`, each with its icon and tint (a theme token: day and night). */
const DOMAIN_LOOK: Readonly<Record<UnitDomain, { icon: string; tint: string }>> = {
  glue: { icon: '💬', tint: 'var(--c-yuzu)' },
  tomodachi: { icon: '👥', tint: 'var(--c-coral)' },
  ie: { icon: '🏠', tint: 'var(--person-b)' },
  tabemono: { icon: '🍙', tint: 'var(--c-leaf)' },
  kaimono: { icon: '🛍️', tint: 'var(--c-lilac)' },
  tabi: { icon: '✈️', tint: 'var(--c-mint)' },
  shigoto: { icon: '💼', tint: 'var(--person-a)' },
  ibento: { icon: '🎉', tint: 'var(--c-yuzu)' },
  machi: { icon: '🏙️', tint: 'var(--c-mint)' },
  karada: { icon: '🩹', tint: 'var(--c-coral)' }
};

/** A unit's domain icon ('' for one this build doesn't know). */
export const domainIcon = (d: string): string => (isUnitDomain(d) ? DOMAIN_LOOK[d].icon : '');
/** A unit's domain tint (mint for one this build doesn't know). */
export const domainTint = (d: string): string => (isUnitDomain(d) ? DOMAIN_LOOK[d].tint : 'var(--c-mint)');

/** A level's mark beside its name: its ★s (its place on the ladder: levelRank), the アナウンス pack 📢. */
export const levelMark = (lv: number): string => (lv === 5 ? '📢' : '★'.repeat(levelRank(lv)));

/** A speed as shown: one decimal (0.8, 1.0, 1.4). */
export const sx = (x: number): string => x.toFixed(1);

/** A tournament's trophy as shown (しずえの しゅうまつ たいかい: the hub's banner, its results, きろく's shelf). */
export const MEDAL: Readonly<Record<'bronze' | 'silver' | 'gold', string>> = { bronze: '🥉', silver: '🥈', gold: '🥇' };
