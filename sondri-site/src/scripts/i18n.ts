/** The language toggle's client half. Base.astro sets `<html lang>` from
    `?lang=` / localStorage before paint; this module captures the initial
    English DOM strings synchronously (with a tiny runtime fallback for strings
    used only in JS animations/widgets) and lazy-loads `/i18n/<lang>.json`
    only when switching to or loading in Spanish. */
import type { Lang } from '../i18n';
import type { Dict } from '../lib/i18n';

export const STORAGE_KEY = 'sondri.lang';
export const EVENT = 'sondri:lang';

const EN_RUNTIME: Dict = {
  'ui.menu': 'Menu',
  'ui.close': 'Close',
  'calculator.person': 'person spends',
  'calculator.people': 'people spend',
  'chatAnim.exchanges.0.0': 'Where is order #4471?',
  'chatAnim.exchanges.0.1': '⚙ lookup_order(#4471)',
  'chatAnim.exchanges.0.2': 'Found · out for delivery',
  'chatAnim.exchanges.0.3': 'Your order arrives today by 5 pm.',
  'chatAnim.exchanges.1.0': 'Can you approve my refund?',
  'chatAnim.exchanges.1.1': '⚙ check_refund(#4471)',
  'chatAnim.exchanges.1.2': 'Eligible · within 30 days',
  'chatAnim.exchanges.1.3': 'Your refund is approved. Allow 3 days.',
  'chatAnim.exchanges.2.0': 'Book a call for tomorrow.',
  'chatAnim.exchanges.2.1': '⚙ find_slot(tomorrow)',
  'chatAnim.exchanges.2.2': 'Available · 10:30 am',
  'chatAnim.exchanges.2.3': 'Your call is booked for 10:30 am.',
};

const dicts: Partial<Record<Lang, Dict>> = {};

function captureEnglishFromDom(): Dict {
  const d: Dict = { ...EN_RUNTIME };
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (k && el.textContent !== null) d[k] = el.textContent;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(' ')) {
      const [attr, key] = pair.split('=');
      const val = attr ? el.getAttribute(attr) : null;
      if (key && val !== null) d[key] = val;
    }
  });
  return d;
}

if (typeof document !== 'undefined') {
  dicts.en = captureEnglishFromDom();
}

export const lang = (): Lang => (document.documentElement.lang === 'es' ? 'es' : 'en');

/** The current language's string for a key (English if it has none). */
export const t = (key: string): string => dicts[lang()]?.[key] ?? dicts.en?.[key] ?? '';

async function loadDict(l: Lang): Promise<Dict> {
  const existing = dicts[l];
  if (existing) return existing;
  const res = await fetch(`/i18n/${l}.json`);
  if (!res.ok) throw new Error(`Failed to load /i18n/${l}.json (${res.status})`);
  const loaded = (await res.json()) as Dict;
  dicts[l] = loaded;
  return loaded;
}

export async function setLang(l: Lang) {
  const d = await loadDict(l);
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
// body if Spanish was asked for; fetch Spanish dictionary, swap, then show.
(async () => {
  try {
    if (lang() !== 'en') await setLang(lang());
  } catch {
    document.documentElement.lang = 'en';
  } finally {
    document.documentElement.classList.remove('i18n-pending');
  }
})();

document.querySelectorAll<HTMLElement>('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    void setLang(b.dataset.lang === 'es' ? 'es' : 'en');
  }),
);
