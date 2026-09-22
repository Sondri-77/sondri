/** The language toggle's client half. Base.astro embeds both flattened
    dictionaries (lib/i18n.ts) as JSON and sets `<html lang>` from `?lang=` /
    localStorage before paint; this module swaps every `[data-i18n]` text
    and `[data-i18n-attr]` attribute in place, keeps the EN | ES buttons'
    `aria-pressed` true, persists the choice, and tells the scripts that
    render text of their own (calculator, nav, chat) via `sondri:lang`. */
import type { Lang } from '../i18n';
import type { Dict } from '../lib/i18n';

export const STORAGE_KEY = 'sondri.lang';
export const EVENT = 'sondri:lang';

const raw = document.getElementById('i18n-data')?.textContent;
const dicts: Record<Lang, Dict> = raw ? JSON.parse(raw) : { en: {}, es: {} };

export const lang = (): Lang => (document.documentElement.lang === 'es' ? 'es' : 'en');

/** The current language's string for a key (English if it has none). */
export const t = (key: string): string => dicts[lang()][key] ?? dicts.en[key] ?? '';

export function setLang(l: Lang) {
  const d = dicts[l];
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const v = d[el.dataset.i18n!];
    if (v !== undefined && el.textContent !== v) el.textContent = v;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(' ')) {
      const [attr, key] = pair.split('=');
      const v = d[key];
      if (v !== undefined) el.setAttribute(attr, v);
    }
  });
  document.documentElement.lang = l;
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  try { localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent(EVENT, { detail: l }));
}

// First paint: the head script has already set <html lang> and hidden the
// body if Spanish was asked for; swap, then show.
try {
  if (lang() !== 'en') setLang(lang());
} finally {
  document.documentElement.classList.remove('i18n-pending');
}
document.querySelectorAll<HTMLElement>('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => setLang(b.dataset.lang === 'es' ? 'es' : 'en')),
);
