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
