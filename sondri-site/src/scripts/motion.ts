// Motion (motion.dev) touches: section fade-ups on scroll and stat count-ups.
// Kept deliberately quiet — no pinning, no scroll-jacking. Elements are only
// hidden when JS is running (html.js), so no-JS visitors see everything.

import { animate, inView } from 'motion';

const REDUCE = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function initMotion(): void {
  if (REDUCE()) return;
  document.documentElement.classList.add('js');

  // Fade-up reveals
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] },
          { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] },
        );
      },
      { amount: 0.25 },
    );
  }

  // Stat count-ups: parse the number out of the rendered text so no-JS (and
  // post-animation) shows the exact final value.
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const m = (el.textContent || '').match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([\s\S]*)$/);
    if (!m) continue;
    const [, pre, numStr, post] = m;
    const target = parseFloat(numStr!);
    const decimals = numStr!.includes('.') ? numStr!.split('.')[1]!.length : 0;
    inView(
      el,
      () => {
        animate(0, target, {
          duration: 1.2,
          ease: 'easeOut',
          onUpdate: (v) => {
            el.textContent = `${pre}${v.toFixed(decimals)}${post}`;
          },
        });
      },
      { amount: 0.6 },
    );
  }
}
