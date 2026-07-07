// Progressive enhancement: scroll reveals, neon-sign phrase cycling,
// cookie-artifact persistence, and the mobile nav toggle.

export function initReveals(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
  if (!els.length) return;
  if (typeof IntersectionObserver === 'undefined') {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
  // safety net: anything already in the viewport after load reveals anyway
  setTimeout(() => {
    for (const el of els) {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight * 1.1) {
        el.classList.add('in');
      }
    }
  }, 1400);
}

/** Neon sign cycles its phrase on each puppet pull (event from dither.ts). */
export function initNeonSign(): void {
  const sign = document.getElementById('neon-sign');
  if (!sign) return;
  let phrases: string[] = [];
  try {
    phrases = JSON.parse(sign.dataset.phrases || '[]');
  } catch {
    return;
  }
  if (!phrases.length) return;
  let current = -1;
  window.addEventListener('sondri:pull', (ev) => {
    const idx = (ev as CustomEvent<{ idx: number }>).detail.idx % phrases.length;
    if (idx === current) return;
    current = idx;
    sign.textContent = phrases[idx] ?? '';
    // retrigger the neonpop animation
    sign.style.animation = 'none';
    void sign.offsetHeight;
    sign.style.animation = '';
  });
}

const CONSENT_KEY = 'sondri-consent';

export function initConsent(): void {
  const artifact = document.getElementById('cookie-artifact');
  if (!artifact) return;
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(CONSENT_KEY) === '1';
  } catch {
    /* storage unavailable — keep showing */
  }
  if (dismissed) {
    artifact.remove();
    return;
  }
  artifact.hidden = false;
  artifact.querySelectorAll<HTMLButtonElement>('[data-dismiss]').forEach((btn) =>
    btn.addEventListener('click', () => {
      try {
        localStorage.setItem(CONSENT_KEY, '1');
      } catch {
        /* ignore */
      }
      artifact.remove();
    }),
  );
}

const REDUCE = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Masked word-level headline reveals. Elements marked [data-words] get each
 * word wrapped in an overflow-hidden span; words slide up with a stagger when
 * the element enters the viewport.
 */
export function initWordReveals(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-words]'));
  if (!els.length) return;
  if (REDUCE() || typeof IntersectionObserver === 'undefined') return;

  for (const el of els) {
    let i = 0;
    const walk = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = (node.textContent || '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const w of words) {
          if (!w) continue;
          if (/^\s+$/.test(w)) {
            frag.appendChild(document.createTextNode(w));
            continue;
          }
          const outer = document.createElement('span');
          outer.className = 'wm';
          const inner = document.createElement('span');
          inner.className = 'wi';
          inner.style.transitionDelay = `${i * 55}ms`;
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
          i++;
        }
        node.parentNode?.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(el.childNodes).forEach(walk);
    el.classList.add('words-ready');
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('words-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.35 },
  );
  els.forEach((el) => io.observe(el));
}

/**
 * Count-up animation for stat numbers marked [data-count]. Parses the number
 * out of the existing text (so no-JS shows the final value) and animates it.
 */
export function initCountUps(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (!els.length) return;
  if (REDUCE() || typeof IntersectionObserver === 'undefined') return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        const m = (el.textContent || '').match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([\s\S]*)$/);
        if (!m) continue;
        const [, pre, numStr, post] = m;
        const target = parseFloat(numStr!);
        const decimals = numStr!.includes('.') ? numStr!.split('.')[1]!.length : 0;
        const dur = 1200;
        const start = performance.now();
        const tick = (now: number): void => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = `${pre}${(target * eased).toFixed(decimals)}${post}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

/** Subtle magnetic pull on primary/ghost buttons (fine pointers only). */
export function initMagnetic(): void {
  if (REDUCE() || !window.matchMedia?.('(pointer: fine)').matches) return;
  const btns = Array.from(
    document.querySelectorAll<HTMLElement>('.btn-primary, .btn-ghost'),
  );
  for (const btn of btns) {
    btn.addEventListener('mousemove', (ev) => {
      const r = btn.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
      btn.style.transform = `translate(${(dx * 5).toFixed(1)}px, ${(dy * 4).toFixed(1)}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  }
}

export function initMobileNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('nav-panel');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'CLOSE ×' : 'MENU ≡';
  });
  panel.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'MENU ≡';
    }),
  );
}
