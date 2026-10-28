// Reactive locale holder. Kept in a .svelte.ts module so `t()` calls in templates re-run on switch.
export type Locale = 'ja' | 'en';

export const i18n = $state<{ locale: Locale }>({ locale: 'ja' });

export function setLocale(locale: Locale): void {
  i18n.locale = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}
