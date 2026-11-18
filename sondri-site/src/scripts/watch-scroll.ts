/* GSAP + ScrollTrigger choreography, chapter tracking, mobile adviser bar sync,
   and unified Stripe Checkout launcher for all watch.sondri.ai pages. */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const WORKER_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8787'
    : 'https://billing.sondri.ai';

export function initWatchScrollAndCheckout() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scroll-triggered reveals for editorial panels, cards & steps
  const reveals = gsap.utils.toArray<HTMLElement>('[data-watch-reveal]');
  if (reduceMotion) {
    reveals.forEach((el) => el.style.setProperty('opacity', '1'));
  } else {
    reveals.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            once: true,
          },
        },
      );
    });
  }

  // 2. Animated named-share comparison bars (animate width smoothly when visible)
  const bars = gsap.utils.toArray<HTMLElement>('[data-bar-fill]');
  bars.forEach((bar) => {
    const targetPct = bar.getAttribute('data-bar-fill') || '0';
    if (reduceMotion) {
      bar.style.width = `${targetPct}%`;
      return;
    }
    gsap.fromTo(
      bar,
      { width: '0%' },
      {
        width: `${targetPct}%`,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: bar,
          start: 'top 88%',
          once: true,
        },
      },
    );
  });

  // 3. Staggered Gate Pipeline & 2x2 Bento Cards progress highlight
  const gateSteps = gsap.utils.toArray<HTMLElement>('[data-gate-step]');
  if (gateSteps.length > 0 && !reduceMotion) {
    gsap.fromTo(
      gateSteps,
      { y: 22, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.14,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: gateSteps[0],
          start: 'top 84%',
          once: true,
        },
      },
    );
  }

  const bentoCards = gsap.utils.toArray<HTMLElement>('[data-bento-card]');
  if (bentoCards.length > 0 && !reduceMotion) {
    gsap.fromTo(
      bentoCards,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: bentoCards[0],
          start: 'top 86%',
          once: true,
        },
      },
    );
  }

  // 3b. Kinetic SVG signal packet animation in Hero pipeline
  const heroPackets = gsap.utils.toArray<HTMLElement>('[data-hero-packet]');
  heroPackets.forEach((pkt, i) => {
    if (reduceMotion) return;
    gsap.fromTo(
      pkt,
      { attr: { cx: 74 } },
      {
        attr: { cx: 386 },
        duration: 2.6,
        delay: i * 1.1,
        repeat: -1,
        ease: 'power1.inOut',
      },
    );
  });

  // 4. Sticky Chapter Rail & Mobile Adviser Bar synchronization
  const chapterLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]'));
  const mobileStageEl = document.getElementById('watchMobileStage');
  const sections = chapterLinks
    .map((a) => {
      const id = a.getAttribute('data-chapter-link') || '';
      const target = document.getElementById(id);
      return target ? { id, link: a, label: a.getAttribute('data-chapter-title') || a.textContent || '', target } : null;
    })
    .filter(Boolean) as { id: string; link: HTMLAnchorElement; label: string; target: HTMLElement }[];

  if (sections.length > 0) {
    const activate = (activeId: string, label: string) => {
      chapterLinks.forEach((l) => {
        const match = l.getAttribute('data-chapter-link') === activeId;
        l.classList.toggle('is-active', match);
        l.setAttribute('aria-current', match ? 'true' : 'false');
      });
      if (mobileStageEl && label) {
        mobileStageEl.textContent = label;
      }
    };

    sections.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec.target,
        start: 'top 42%',
        end: 'bottom 42%',
        onEnter: () => activate(sec.id, sec.label),
        onEnterBack: () => activate(sec.id, sec.label),
      });
    });
  }

  // 5. Sync audited domain/score into the mobile adviser bar & checkout metadata
  const scoreBadge = document.getElementById('watchMobileScore');
  const syncAuditedContext = () => {
    const scoreText = document.getElementById('readinessBadge')?.textContent?.trim();
    if (scoreBadge && scoreText && scoreText !== '--') {
      scoreBadge.textContent = scoreText;
      scoreBadge.style.display = 'inline-flex';
    }
  };
  const readinessNode = document.getElementById('readinessBadge');
  if (readinessNode) {
    const mo = new MutationObserver(syncAuditedContext);
    mo.observe(readinessNode, { childList: true, characterData: true, subtree: true });
  }

  // 6. Wire all `[data-watch-checkout]` buttons directly to billing-worker Stripe Checkout
  document.querySelectorAll<HTMLButtonElement>('[data-watch-checkout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sku = btn.getAttribute('data-watch-checkout');
      if (!sku) return;

      const labelEl = btn.querySelector<HTMLElement>('[data-btn-label]') || btn;
      const originalText = labelEl.textContent || '';
      const langAttr = document.documentElement.lang === 'es' ? 'es' : 'en';

      // Grab domain/email from the MiniAudit intake inputs if the user already filled them
      const rawUrl = (document.getElementById('auditUrl') as HTMLInputElement | null)?.value?.trim() || '';
      const email = (document.getElementById('leadEmail') as HTMLInputElement | null)?.value?.trim() || '';
      const service = (document.getElementById('auditService') as HTMLInputElement | null)?.value?.trim() || '';
      const city = (document.getElementById('auditCity') as HTMLInputElement | null)?.value?.trim() || '';

      let domain = rawUrl;
      try {
        if (rawUrl) {
          domain = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`).hostname.replace(/^www\./, '');
        }
      } catch {
        domain = rawUrl;
      }

      btn.disabled = true;
      labelEl.textContent = langAttr === 'es' ? 'Abriendo Stripe…' : 'Opening Stripe…';

      try {
        const res = await fetch(`${WORKER_BASE}/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'watch_offer',
            offer_sku: sku,
            domain: domain || undefined,
            client_email: email || undefined,
            service: service || undefined,
            city: city || undefined,
            lang: langAttr,
            success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&type=${encodeURIComponent(sku)}`,
            cancel_url: window.location.href,
          }),
        });

        const json = await res.json();
        if (json.success && json.data?.checkout_url) {
          window.location.href = json.data.checkout_url;
          return;
        }
        throw new Error(json.error?.message || 'Unable to start Stripe Checkout');
      } catch (err: any) {
        alert(err?.message || 'Connection error reaching Stripe Checkout');
        btn.disabled = false;
        labelEl.textContent = originalText;
      }
    });
  });
}
