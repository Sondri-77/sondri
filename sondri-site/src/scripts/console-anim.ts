/** The runner the three solution animations share (ported from the
    playground cards' IIFEs, which each carried a copy of it). It owns the
    clock: a requestAnimationFrame loop that only runs while the panel is on
    screen, the tab is visible and no ancestor holds it with
    `data-anim-paused` (the hero carousel's hidden slides), and stands still
    on one frame under reduced motion. `render(time, reduced)` draws the
    frame for `time` seconds; `loop` is the story's length in seconds, so a
    holder can restart it at the next loop boundary (a `sondri:anim` event
    with `{ restart: root }`) and time itself to it (`data-loop`).
    Guarded against a second init on the same root. */
export type Render = (time: number, reduced: boolean) => void;

/** Dispatched on `document` to re-sync every runner (after a hold changes);
    `detail.restart` names the root that should begin its next loop. */
export const ANIM_EVENT = 'sondri:anim';

export function runAnimation(root: HTMLElement, render: Render, stillAt: number, loop?: number) {
  if (root.dataset.inited) return;
  root.dataset.inited = '1';
  if (loop) root.dataset.loop = String(loop);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;

  const held = () => root.closest('[data-anim-paused]') !== null;
  const tick = (now: number) => {
    frame = 0;
    if (!root.isConnected) { observer.disconnect(); cleanup(); return; }
    if (!visible || held() || document.hidden || motion.matches) return;
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
    else if (visible && !held() && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const onEvent = (e: Event) => {
    const restart = (e as CustomEvent<{ restart?: Element }>).detail?.restart;
    if (restart === root && loop && elapsed > 0) elapsed = (Math.floor(elapsed / loop + 1e-6) + 1) * loop;
    sync();
  };
  const cleanup = () => {
    document.removeEventListener('visibilitychange', sync);
    document.removeEventListener(ANIM_EVENT, onEvent);
    motion.removeEventListener('change', sync);
  };
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  }, { threshold: 0 });
  observer.observe(root);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener(ANIM_EVENT, onEvent);
  motion.addEventListener('change', sync);
  render(motion.matches ? stillAt : 0, motion.matches);
}
