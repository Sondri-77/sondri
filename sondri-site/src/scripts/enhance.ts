// Progressive enhancement: cookie-artifact persistence and the mobile nav.

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
