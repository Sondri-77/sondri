/** The runner the three Console animations share (ported from the playground
    cards' IIFEs, which each carried a copy of it). It owns the clock: a
    requestAnimationFrame loop that only runs while the panel is on screen
    and the tab is visible, and stands still on one frame under reduced
    motion. `render(time, reduced)` draws the frame for `time` seconds.
    Guarded against a second init on the same root. */
export type Render = (time: number, reduced: boolean) => void;

export function runAnimation(root: HTMLElement, render: Render, stillAt: number) {
  if (root.dataset.inited) return;
  root.dataset.inited = '1';

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;

  const tick = (now: number) => {
    frame = 0;
    if (!root.isConnected) { observer.disconnect(); cleanup(); return; }
    if (!visible || document.hidden || motion.matches) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    elapsed += dt;
    render(elapsed, false);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (motion.matches) render(stillAt, true);
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const cleanup = () => {
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
  };
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0 });
  observer.observe(root);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  render(motion.matches ? stillAt : 0, motion.matches);
}
