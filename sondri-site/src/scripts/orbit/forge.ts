// Boot for the how-it-works assembly sequence. On reduced motion or no
// WebGL the stage is removed and the page's classic hero takes over.

import { runScrubStage, webglAvailable } from './scrub';

export function initForge(): void {
  const stage = document.getElementById('forge-stage');
  if (!stage) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !webglAvailable()) {
    stage.remove();
    return;
  }

  const canvas = stage.querySelector<HTMLCanvasElement>('#forge-canvas');
  const sticky = stage.querySelector<HTMLElement>('.orbit-sticky');
  if (!canvas || !sticky) return;

  import('./assembly').then(({ createAssembly }) => {
    runScrubStage({
      stage,
      canvas,
      sticky,
      cue: stage.querySelector<HTMLElement>('#forge-cue'),
      readout: stage.querySelector<HTMLElement>('#forge-readout'),
      readoutText(p) {
        if (p <= 0.28) return 'ENGINE 0 — DISCOVER';
        if (p <= 0.58) return 'ENGINE 0 → 1 — BUILD';
        if (p <= 0.72) return 'ENGINE 1 — DEPLOY';
        return 'ENGINE 1 → n — SCALE';
      },
      scene: createAssembly(canvas),
    });
  });
}
