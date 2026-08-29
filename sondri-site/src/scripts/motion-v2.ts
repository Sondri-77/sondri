/* v2 motion system — Motion (scroll/in-view/springs) + anime.js (count-ups).
   Rules: content is visible without JS (initial hidden states are set here,
   never in CSS); everything bails under prefers-reduced-motion; a rescue
   timer un-hides anything an observer misses. */

import { animate as motionAnimate, inView } from 'motion';
import { animate as animeAnimate } from 'animejs';
import { initGlyphFields } from './glyph-field';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 260, damping: 13 } as const;

function reveals() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  els.forEach((el) => {
    const children = el.hasAttribute('data-reveal-group')
      ? Array.from(el.children as HTMLCollectionOf<HTMLElement>)
      : [el];
    children.forEach((c) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(24px)';
    });
    inView(
      el,
      () => {
        children.forEach((c, i) => {
          motionAnimate(
            c,
            { opacity: 1, transform: 'translateY(0px)' },
            { duration: 0.55, delay: i * 0.08, ease: EASE },
          );
        });
      },
      { amount: 0.2 },
    );
  });

  // Rescue: never leave content hidden if an observer misfires.
  setTimeout(() => {
    document
      .querySelectorAll<HTMLElement>('[data-reveal] , [data-reveal] > *, .gdot')
      .forEach((el) => {
        if (getComputedStyle(el).opacity === '0' || getComputedStyle(el).transform.includes('matrix(0')) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
  }, 2400);
}

/* Every section headline's gold period springs in after its heading reveals. */
function goldPeriods() {
  document.querySelectorAll<HTMLElement>('h2 .gdot').forEach((dot) => {
    dot.style.display = 'inline-block';
    dot.style.transform = 'scale(0)';
    const h = dot.closest('h2')!;
    inView(
      h,
      () => {
        motionAnimate(dot, { transform: 'scale(1)' }, { ...SPRING, delay: 0.4 });
      },
      { amount: 0.8 },
    );
  });
}

function countUps() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const m = el.textContent?.trim().match(/^([^0-9]*)([\d.]+)(.*)$/);
    if (!m) return;
    const [, prefix, num, suffix] = m;
    const end = parseFloat(num);
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    const state = { v: 0 };
    const tick = el.parentElement?.querySelector<HTMLElement>('.tick');
    inView(
      el,
      () => {
        animeAnimate(state, {
          v: end,
          duration: 1200,
          ease: 'outCubic',
          onUpdate: () => {
            el.textContent = `${prefix}${state.v.toFixed(decimals)}${suffix}`;
          },
          onComplete: () => {
            // Ambient: a gold hairline ticks in under the settled number.
            if (tick) motionAnimate(tick, { transform: 'scaleX(1)' }, { duration: 0.45, ease: EASE });
          },
        });
      },
      { amount: 0.6 },
    );
  });
}

/* Ambient: sector names take turns catching the light. */
function spotlight() {
  const strip = document.querySelector<HTMLElement>('.sectors');
  if (!strip) return;
  const items = Array.from(strip.querySelectorAll<HTMLElement>('.sect-in span'));
  if (!items.length) return;
  let i = -1;
  let timer: ReturnType<typeof setInterval> | null = null;
  const step = () => {
    if (document.hidden) return;
    items[i]?.classList.remove('lit');
    i = (i + 1) % items.length;
    items[i].classList.add('lit');
  };
  inView(
    strip,
    () => {
      timer = setInterval(step, 2800);
      step();
      return () => {
        if (timer) clearInterval(timer);
        items[i]?.classList.remove('lit');
      };
    },
    { amount: 0.5 },
  );
}

export function initMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  initGlyphFields(!reduced);
  if (reduced) return;
  reveals();
  goldPeriods();
  countUps();
  spotlight();
}
