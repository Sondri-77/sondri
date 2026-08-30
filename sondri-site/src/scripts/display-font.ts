/**
 * Display-face swapping, shared by the floating switcher and the nav.
 *
 * The wordmark has to move with the headings — a Florexa lockup over Matrixel
 * H1s reads as a mistake — so this drives both from one call.
 */

export const DISPLAY_FONT_KEY = 'sondri-display-font';

/** Faces with drawn lockup artwork in /public/brand/wordmarks. */
const LOCKUPS: Record<string, string> = {
  Florexa: '/brand/wordmarks/florexa-white-gold.svg',
  Matrixel: '/brand/wordmarks/matrixel-white-gold.svg',
};

/** The v2 original, kept reachable for comparison. */
export const SERIF_SENTINEL = '__serif';

export function applyDisplayFont(family: string): void {
  const root = document.documentElement;
  const isSerif = !family || family === SERIF_SENTINEL;

  root.style.setProperty('--font-display', isSerif ? 'var(--serif)' : `'${family}'`);
  root.dataset.displayFont = isSerif ? 'serif' : family;

  swapLockup(isSerif ? '' : family);
}

/**
 * Nav lockup follows the face: drawn artwork where it exists, live type
 * otherwise, and the shipped PNG when we're back on the v2 original.
 */
function swapLockup(family: string): void {
  const img = document.querySelector<HTMLImageElement>('[data-lockup-img]');
  const text = document.querySelector<HTMLElement>('[data-lockup-text]');
  if (!img || !text) return;

  const art = family ? LOCKUPS[family] : img.dataset.lockupDefault;

  if (art) {
    img.src = art;
    img.hidden = false;
    text.hidden = true;
  } else {
    // No drawn mark for this face — set the wordmark live instead.
    text.style.fontFamily = `'${family}'`;
    text.hidden = false;
    img.hidden = true;
  }
}

/**
 * Applied before paint so the nav never flashes the wrong wordmark.
 * Kept dependency-free: this runs as an inline script in <head>.
 */
export function readStoredFont(): string {
  try {
    return localStorage.getItem(DISPLAY_FONT_KEY) || '';
  } catch {
    return '';
  }
}
