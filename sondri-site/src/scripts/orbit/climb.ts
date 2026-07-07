// Boot for the for-customers ascent sequence (chaos → order → the climb).

import { runScrubStage, webglAvailable } from './scrub';

export function initClimb(): void {
  const stage = document.getElementById('ascent-stage');
  if (!stage) return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !webglAvailable()) {
    stage.remove();
    return;
  }

  const canvas = stage.querySelector<HTMLCanvasElement>('#ascent-canvas');
  const sticky = stage.querySelector<HTMLElement>('.orbit-sticky');
  if (!canvas || !sticky) return;

  import('./ascent').then(({ createAscent }) => {
    runScrubStage({
      stage,
      canvas,
      sticky,
      cue: stage.querySelector<HTMLElement>('#ascent-cue'),
      readout: stage.querySelector<HTMLElement>('#ascent-readout'),
      readoutText(p) {
        if (p <= 0.18) return 'STATE — CHAOS';
        if (p <= 0.32) return 'STATE — GOVERNED';
        if (p >= 0.9) return 'SUMMIT — STANDING PARTNER';
        const i = Math.min(4, Math.max(0, Math.round(((p - 0.38) / 0.475) * 4)));
        return `RUNG 0${i + 1} OF 05`;
      },
      scene: createAscent(canvas),
    });
  });
}
