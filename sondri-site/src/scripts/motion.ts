/* Motion system — Motion (scroll/in-view/springs) + anime.js (count-ups),
   ported from the tk-dev/v2 site's motion-v2.ts and fitted to brutal's markup.

   Rules carried over from that file, and they matter:
     · content is visible without JS — initial hidden states are set here,
       never in CSS, so a failed script leaves a readable page;
     · everything bails under prefers-reduced-motion;
     · a rescue timer un-hides anything an observer misses.

   What changed for this site: the reveal targets are brutal's own
   [data-reveal] elements, which stagger themselves through an inline
   transition-delay, so that delay is read and handed to Motion rather than
   left on a transition that no longer runs. The spotlight walks the
   capability strip instead of v2's sector list. */

import { animate as motionAnimate, inView } from 'motion';
import { animate as animeAnimate } from 'animejs';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const SPRING = { type: 'spring', stiffness: 260, damping: 13 } as const;

/** brutal staggers columns with `transition-delay: Nms`. The transition is
    gone, so read the delay off the element and give it to Motion instead. */
function staggerOf(el: HTMLElement): number {
  const ms = parseFloat(el.style.transitionDelay || '0');
  return Number.isFinite(ms) ? ms / 1000 : 0;
}

function reveals() {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    inView(
      el,
      () => {
        motionAnimate(
          el,
          { opacity: 1, transform: 'translateY(0px)' },
          { duration: 0.55, delay: staggerOf(el), ease: EASE },
        );
      },
      { amount: 0.2 },
    );
  });
}

/* Every heading's gold full stop springs in once the heading has revealed. */
function goldPeriods() {
  document.querySelectorAll<HTMLElement>('h1 .gdot, h2 .gdot').forEach((dot) => {
    if (!dot.textContent?.trim()) return;
    dot.style.display = 'inline-block';
    dot.style.transform = 'scale(0)';
    const h = dot.closest('h1, h2');
    if (!h) return;
    inView(
      h,
      () => {
        motionAnimate(dot, { transform: 'scale(1)' }, { ...SPRING, delay: 0.4 });
      },
      { amount: 0.8 },
    );
  });
}

/* The three problem statistics count up from zero. Values carry their own
   prefix and suffix ("88%", "$2M+", "9 mo."), so the run is parsed out and
   put back between them. */
function countUps() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const m = el.textContent?.trim().match(/^([^0-9]*)([\d.]+)(.*)$/);
    if (!m) return;
    const [, prefix, num, suffix] = m;
    const end = parseFloat(num);
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    const state = { v: 0 };
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
        });
      },
      { amount: 0.6 },
    );
  });
}

/* Ambient: capabilities take turns catching the light as the strip scrolls. */
function spotlight() {
  const strip = document.querySelector<HTMLElement>('.strip');
  if (!strip) return;
  const items = Array.from(strip.querySelectorAll<HTMLElement>('.item'));
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

/* The landing: the treated background settles out of a slight zoom while the
   headline, lede, button and risk line come up under it. Runs once. */
function hero() {
  const section = document.querySelector<HTMLElement>('[data-hero]');
  if (!section) return;

  const bg = section.querySelector<HTMLElement>('.bg');
  if (bg) {
    bg.style.opacity = '0';
    bg.style.transform = 'scale(1.08)';
    bg.style.filter = 'blur(6px)';
    motionAnimate(
      bg,
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
      { duration: 1.2, ease: EASE },
    );
  }

  const steps = [
    section.querySelector<HTMLElement>('h1'),
    section.querySelector<HTMLElement>('.lede'),
    section.querySelector<HTMLElement>('.actions'),
    section.querySelector<HTMLElement>('.copy > .label'),
  ].filter((el): el is HTMLElement => !!el);

  steps.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    motionAnimate(
      el,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0.6, delay: 0.25 + i * 0.09, ease: EASE },
    );
  });
}

/** Never leave content hidden if an observer misfires or a promise rejects. */
function rescue() {
  setTimeout(() => {
    document
      .querySelectorAll<HTMLElement>('[data-reveal], [data-hero] .copy > *, .gdot, [data-hero] .bg')
      .forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.opacity === '0' || cs.transform.includes('matrix(0')) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';
        }
      });
  }, 2400);
}

export function initMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hero();
  reveals();
  goldPeriods();
  countUps();
  spotlight();
  rescue();
}
