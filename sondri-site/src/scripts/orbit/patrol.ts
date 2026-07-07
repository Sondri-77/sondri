// Boot for the industries rank sequence. Sector names for the HUD readout
// come from the stage's data-sectors attribute (kept next to the beats in
// the page markup so copy lives in one place).

import { runScrubStage, webglAvailable } from './scrub';

export function initPatrol(): void {
  const stage = document.getElementById('rank-stage');
  if (!stage) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !webglAvailable()) {
    stage.remove();
    return;
  }

  const canvas = stage.querySelector<HTMLCanvasElement>('#rank-canvas');
  const sticky = stage.querySelector<HTMLElement>('.orbit-sticky');
  if (!canvas || !sticky) return;

  let sectors: string[] = [];
  try {
    sectors = JSON.parse(stage.dataset.sectors || '[]');
  } catch {
    sectors = [];
  }

  import('./rank').then(({ createRank }) => {
    runScrubStage({
      stage,
      canvas,
      sticky,
      cue: stage.querySelector<HTMLElement>('#rank-cue'),
      readout: stage.querySelector<HTMLElement>('#rank-readout'),
      readoutText(p) {
        if (p <= 0.06) return 'RANK — SIX SECTORS';
        if (p >= 0.88) return 'RANK — YOUR SECTOR NEXT';
        const i = Math.min(
          sectors.length - 1,
          Math.max(0, Math.floor(((p - 0.06) / 0.82) * sectors.length)),
        );
        const name = sectors[i] ?? '';
        return `UNIT 0${i + 1} — ${name.toUpperCase()}`;
      },
      scene: createRank(canvas),
    });
  });
}
