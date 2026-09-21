// Optional enhancement: mark the selected index link. Rendering is entirely HTML/CSS.
(() => {
  const links = document.querySelectorAll('.study-nav a');
  const markCurrent = () => {
    for (const link of links) {
      if (link.hash === window.location.hash) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };
  window.addEventListener('hashchange', markCurrent);
  markCurrent();
})();

// Part C: the three calculators share one model - wage x hours x people x 52 weeks.
// Each [data-calc] card owns its inputs (data-key) and outputs (data-out); the HTML carries the defaults.
(() => {
  const FIX = 9500; // [placeholder] fix cost until a real figure exists
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  for (const root of document.querySelectorAll('[data-calc]')) {
    const inputs = [...root.querySelectorAll('input[data-key]')];
    const outs = [...root.querySelectorAll('[data-out]')];
    const bars = [...root.querySelectorAll('[data-bar]')];
    const read = key => Number(inputs.find(input => input.dataset.key === key).value);
    const update = () => {
      const wage = read('wage'), hours = read('hours'), people = read('people');
      const total = wage * hours * people * 52;
      const text = {
        wage: money(wage), 'wage-h': money(wage) + '/h', hours: hours + ' h', people: String(people),
        'people-word': people === 1 ? 'person spends' : 'people spend', total: money(total), fix: money(FIX)
      };
      for (const out of outs) out.textContent = text[out.dataset.out];
      const top = Math.max(total, FIX);
      for (const bar of bars) bar.style.width = ((bar.dataset.bar === 'fix' ? FIX : total) / top * 100).toFixed(1) + '%';
    };
    for (const input of inputs) input.addEventListener('input', update);
    update();
  }

  // C3 inline edits: click a bold value to reveal its slider; arrow keys on the value nudge it directly.
  const edits = [...document.querySelectorAll('.edit')];
  const closeAll = () => edits.forEach(edit => edit.classList.remove('is-open'));
  for (const edit of edits) {
    const value = edit.querySelector('.edit-value');
    const input = edit.querySelector('input');
    const pop = edit.querySelector('.edit-pop');
    const open = () => {
      closeAll();
      edit.classList.add('is-open');
      input.focus({ preventScroll: true });
    };
    value.addEventListener('click', event => {
      event.stopPropagation();
      if (edit.classList.contains('is-open')) closeAll(); else open();
    });
    value.addEventListener('keydown', event => {
      const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
      if (step) {
        event.preventDefault();
        input.stepUp(step);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' || event.key === 'Enter') { closeAll(); value.focus(); }
    });
    pop.addEventListener('click', event => event.stopPropagation());
  }
  document.addEventListener('click', closeAll);
})();
