// Runs before first paint: marks JS, decides whether the intro plays.
(function () {
  var d = document.documentElement;
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.classList.add('js');
  if (rm) { d.classList.add('ready', 'rm'); return; }
  d.classList.add('intro');
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  // failsafe: whatever happens, the page is never held back
  setTimeout(function () {
    d.classList.remove('intro'); d.classList.add('ready');
    var l = document.querySelector('.loader'); if (l && l.parentNode) l.parentNode.removeChild(l);
    if (!d.classList.contains('booted')) d.classList.add('safe');
  }, 9000);
})();
