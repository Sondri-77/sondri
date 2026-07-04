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
