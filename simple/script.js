// Sudarshan Das portfolio v2. Hand-written, no libraries, no network. Honors prefers-reduced-motion.
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  var NARROW = window.innerWidth < 640;
  var raf = window.requestAnimationFrame.bind(window);
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var ARROW = '<svg viewBox="0 0 17 21" aria-hidden="true"><path d="M1.5 1.2l13.6 8.2-5.9 1.6-2.8 5.9z"/></svg>';
  var COLORS = ['#7cf0c8', '#ffd166', '#b69cff', '#ff9ecb', '#6ee7ff', '#ff8a5c', '#a3e635', '#f0abfc'];

  de.classList.add('booted');

  /* ---------- text prep (runs before the intro measures the layout) ---------- */
  var title = $('.hero-title');
  if (title && !title.getAttribute('data-done')) {
    var txt = title.textContent;
    title.setAttribute('aria-label', txt);
    title.setAttribute('data-done', '1');
    title.innerHTML = '';
    txt.split('').forEach(function (c, i) {
      var s = d.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i); s.textContent = c; title.appendChild(s);
    });
  }
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/); var i = 0;
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = '';
    words.forEach(function (w, k) {
      var o = d.createElement('span'); o.className = 'w'; o.setAttribute('aria-hidden', 'true');
      var s = d.createElement('span'); s.style.setProperty('--i', i++); s.textContent = w; o.appendChild(s);
      el.appendChild(o); if (k < words.length - 1) el.appendChild(d.createTextNode(' '));
    });
  });
  $$('[data-stagger]').forEach(function (p) {
    Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); if (!c.hasAttribute('data-d')) c.style.setProperty('--d', i + 1); });
  });
  $$('[data-delay]').forEach(function (el) { el.style.setProperty('--d', el.getAttribute('data-delay')); });
  // reveal variants
  $$('.principles li, .skill-group, .hero-list li').forEach(function (el) { if (!el.classList.contains('reveal') && !el.closest('.hero')) el.classList.add('reveal'); });
  $$('.cards .card:first-child, .timeline li:nth-child(even)').forEach(function (el) { el.classList.add('r-left'); });
  $$('.stat').forEach(function (el) { el.classList.add('r-scale'); });

  // odometer counters
  $$('.num[data-to]').forEach(function (el) {
    var to = String(parseInt(el.getAttribute('data-to'), 10) || 0);
    var pad = parseInt(el.getAttribute('data-pad'), 10) || 2;
    while (to.length < pad) to = '0' + to;
    el.setAttribute('aria-label', to); el.setAttribute('data-final', to);
    if (RM) return;
    el.innerHTML = '';
    var wrap = d.createElement('span'); wrap.className = 'odo'; wrap.setAttribute('aria-hidden', 'true');
    to.split('').forEach(function (ch, k) {
      var col = d.createElement('span'); col.className = 'col'; col.style.setProperty('--k', k); col.setAttribute('data-d', ch);
      for (var n = 0; n < 10; n++) { var s = d.createElement('span'); s.textContent = n; col.appendChild(s); }
      wrap.appendChild(col);
    });
    el.appendChild(wrap);
  });
  function runCount(el) {
    $$('.col', el).forEach(function (c, k) {
      var digit = parseInt(c.getAttribute('data-d'), 10);
      // spin one full lap (0-9) first, then land on the digit
      c.style.transitionDuration = (1.1 + k * .15) + 's';
      c.style.transform = 'translateY(' + (-digit) + 'em)';
    });
  }

  /* ---------- scramble section tags ---------- */
  function scramble(el) {
    var t = el.getAttribute('data-text') || el.textContent; el.setAttribute('data-text', t);
    var pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/<>_+*';
    var start = performance.now(), dur = 900;
    (function f(now) {
      var p = clamp((now - start) / dur, 0, 1), out = '';
      for (var i = 0; i < t.length; i++) {
        var ch = t.charAt(i);
        out += (/[A-Za-z0-9]/.test(ch) && p < (i / t.length) * .75 + .25) ? pool.charAt(Math.floor(Math.random() * pool.length)) : ch;
      }
      el.textContent = out;
      if (p < 1) raf(f); else el.textContent = t;
    })(start);
  }

  /* ---------- design-tool selection box ---------- */
  function selbox(el) {
    if (RM || el.__sel) return; el.__sel = 1;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var b = d.createElement('span'); b.className = 'selbox'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<i></i><i></i><i></i><i></i><em>' + Math.round(el.offsetWidth) + ' × ' + Math.round(el.offsetHeight) + '</em>';
    el.appendChild(b);
    setTimeout(function () { b.classList.add('on'); }, 40);
    setTimeout(function () { b.classList.remove('on'); }, 1900);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 2500);
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.reveal, [data-split], [data-scramble], .num[data-to], .section, .stat, .card, .about-img, .timeline li');
  function onIn(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-scramble')) scramble(el);
    if (el.matches('.num[data-to]')) runCount(el);
    if (el.hasAttribute('data-sel')) selbox(el);
  }
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { onIn(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { onIn(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$('.num[data-to]').forEach(function (el) { io.unobserve(el); cio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    $$('.num[data-to]').forEach(function (el) { el.textContent = el.getAttribute('data-final'); });
  }

  /* ---------- typed role pill ---------- */
  function typeRole() {
    var t = $('.typed'); if (!t || RM) return;
    var full = t.textContent; t.textContent = ''; var i = 0;
    var iv = setInterval(function () { t.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(iv); }, 38);
  }

  /* ---------- the intro: a design tool "builds" the hero ---------- */
  var introEl = null, introDone = false;
  function endIntro(fast) {
    if (introDone) return; introDone = true;
    de.classList.remove('intro'); de.classList.add('ready');
    window.scrollTo(0, 0);
    setTimeout(typeRole, 900);
    if (introEl) {
      introEl.classList.add('open');
      setTimeout(function () { if (introEl && introEl.parentNode) introEl.parentNode.removeChild(introEl); }, fast ? 500 : 1100);
    }
    startGhosts();
  }
  function runIntro() {
    if (RM) { de.classList.remove('intro'); de.classList.add('ready'); startGhosts(); return; }
    window.scrollTo(0, 0);
    var vw = window.innerWidth, vh = window.innerHeight;
    var L = introEl = d.createElement('div'); L.className = 'loader'; L.setAttribute('aria-hidden', 'true');
    L.innerHTML = '<div class="in-panel top"></div><div class="in-panel bot"></div><div class="in-grid"></div><div class="in-stage"></div>' +
      '<div class="in-logo">SD</div><div class="in-skip">Tap to skip</div><div class="in-count"><span>Assembling portfolio</span><b>000</b></div>';
    d.body.appendChild(L);
    var stage = $('.in-stage', L), cnt = $('.in-count b', L);
    var timers = [], cursors = [];
    var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    L.addEventListener('click', function () { timers.forEach(clearTimeout); endIntro(true); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') { timers.forEach(clearTimeout); endIntro(true); } });

    // swarm of cursors that gather around the logo chip
    var n = NARROW ? 9 : 14;
    for (var i = 0; i < n; i++) {
      var c = d.createElement('div'); c.className = 'in-cur'; c.style.setProperty('--c', COLORS[i % COLORS.length]); c.innerHTML = ARROW;
      var side = Math.floor(rnd(0, 4));
      var sx = side === 0 ? -40 : side === 1 ? vw + 40 : rnd(0, vw), sy = side === 2 ? -40 : side === 3 ? vh + 40 : rnd(0, vh);
      c.style.transition = 'none'; c.style.transform = 'translate(' + sx + 'px,' + sy + 'px)';
      stage.appendChild(c); cursors.push(c);
    }
    var cx = vw / 2, cy = vh / 2;
    at(60, function () {
      L.classList.add('p1');
      cursors.forEach(function (c, i) {
        var a = (i / cursors.length) * Math.PI * 2 + rnd(-.2, .2), r = rnd(60, NARROW ? 110 : 150);
        c.style.transition = ''; c.classList.add('show');
        c.style.transitionDelay = (i * 30) + 'ms';
        c.style.transform = 'translate(' + (cx + Math.cos(a) * r) + 'px,' + (cy + Math.sin(a) * r) + 'px)';
      });
    });
    // count 000 -> 100
    var t0 = performance.now(), TOTAL = 3300;
    (function tick(now) {
      if (introDone) return;
      var p = clamp((now - t0) / TOTAL, 0, 1);
      cnt.textContent = String(Math.round(easeIO(p) * 100)).padStart(3, '0');
      if (p < 1) raf(tick);
    })(t0);

    // wireframe: cursors drag out selection boxes exactly over the real hero pieces
    at(1250, function () {
      L.classList.add('p2');
      var targets = [
        ['.hero-title', 'Heading', 0], ['.hello', 'Name', 1], ['.rolepill', 'Role', 2], ['.hero-card', 'Portrait', 3], ['.hero-list', 'List', 4]
      ];
      targets.forEach(function (tg) {
        var el = $(tg[0]); if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh || r.width < 4) return;
        var k = tg[2];
        at(k * 300, function () {
          var box = d.createElement('div'); box.className = 'fbox';
          var w = Math.round(r.width), h = Math.round(r.height);
          box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.setProperty('--w', r.width + 'px'); box.style.setProperty('--h', r.height + 'px');
          box.innerHTML = '<i></i><i></i><i></i><i></i><u>' + tg[1] + '</u><em>' + w + ' × ' + h + '</em>';
          stage.appendChild(box);
          var cur = cursors[k % cursors.length];
          cur.style.transitionDelay = '0ms'; cur.classList.add('drag');
          cur.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
          setTimeout(function () {
            box.classList.add('go');
            cur.style.transform = 'translate(' + (r.left + r.width) + 'px,' + (r.top + r.height) + 'px)';
          }, 70);
          setTimeout(function () { box.classList.add('fill'); }, 800);
        });
      });
      // remaining cursors drift to scattered spots
      cursors.forEach(function (c, i) {
        if (i < 5) return; c.style.transitionDelay = (i * 40) + 'ms';
        c.style.transform = 'translate(' + rnd(10, vw - 30) + 'px,' + rnd(10, vh - 30) + 'px)';
      });
    });
    at(TOTAL - 150, function () { endIntro(false); });
  }

  /* ---------- ghost cursors (collaborators moving around the page) ---------- */
  var ghostsOn = false;
  function startGhosts() {
    if (ghostsOn || RM) return; ghostsOn = true;
    var host = $('.ghosts'); if (!host) return;
    var specs = NARROW ? [['Tab', '#7cf0c8'], ['', '#ffd166']] : [['Tab', '#7cf0c8'], ['Sudarshan', '#ffd166'], ['', '#b69cff'], ['', '#ff9ecb']];
    var G = specs.map(function (s, i) {
      var g = d.createElement('div'); g.className = 'ghost'; g.style.setProperty('--c', s[1]);
      g.innerHTML = ARROW + (s[0] ? '<em>' + s[0] + '</em>' : ''); host.appendChild(g);
      var o = { el: g, x: rnd(0, innerWidth), y: rnd(0, innerHeight), tx: 0, ty: 0, next: 0, sp: rnd(.012, .03), follow: i === 1 && FINE };
      setTimeout(function () { g.classList.add('on'); }, 500 + i * 400);
      return o;
    });
    var mxx = innerWidth / 2, myy = innerHeight / 2;
    window.addEventListener('pointermove', function (e) { mxx = e.clientX; myy = e.clientY; }, { passive: true });
    var last = 0;
    (function loop(now) {
      raf(loop);
      if (now - last < 16) return; last = now;
      var W = innerWidth, H = innerHeight;
      G.forEach(function (o) {
        if (o.follow && FINE) { o.tx = mxx + 90; o.ty = myy + 60; }
        else if (now > o.next) {
          o.tx = rnd(20, W - 120); o.ty = rnd(70, H - 60); o.next = now + rnd(2200, 5200);
          if (Math.random() < .5) { o.el.classList.add('click'); setTimeout(function () { o.el.classList.remove('click'); }, 400); }
        }
        o.x = lerp(o.x, o.tx, o.sp); o.y = lerp(o.y, o.ty, o.sp);
        o.el.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px,0)';
      });
    })(0);
  }

  /* ---------- scroll engine: progress, parallax, marquee, timeline, rail ---------- */
  var bar = $('.progress i'), rail = $('.rail'), railLis = $$('.rail li'), navLinks = $$('.pillnav nav a');
  var heroTitle = $('.hero-title'), heroCard = $('.hero-card'), heroGlow = $('.hero .glow'), heroBg = $('.hero-bg');
  var secs = $$('.section'), pars = $$('[data-par]'), tl = $('[data-timeline]'), tlLis = tl ? $$('li', tl) : [];
  var rows = $$('.marquee .row'), marq = $('.marquee');
  var vel = 0, lastY = window.scrollY, topbar = $('.topbar'), hideAcc = 0;
  var rowState = rows.map(function (r) { return { el: $('.track', r), x: 0, dir: parseFloat(r.getAttribute('data-dir')) || -1, half: 0 }; });
  function measure() {
    rowState.forEach(function (s) { s.half = s.el.scrollWidth / 2 || 1; });
  }
  if (!RM && rows.length) {
    de.classList.add('js-marquee');
    rowState.forEach(function (s) { s.el.innerHTML = s.el.innerHTML + s.el.innerHTML; });
    measure(); window.addEventListener('resize', measure);
  }
  function frame() {
    var y = window.scrollY, vh = window.innerHeight, H = d.documentElement.scrollHeight - vh;
    var dy = y - lastY; lastY = y; vel = lerp(vel, dy, .15);
    var p = H > 0 ? clamp(y / H, 0, 1) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (rail) rail.style.setProperty('--p', p.toFixed(4));
    if (!RM) {
      if (heroTitle && y < vh * 1.3) {
        heroTitle.style.transform = 'translate3d(0,' + (y * .22).toFixed(1) + 'px,0) scale(' + (1 - clamp(y / vh, 0, 1) * .06).toFixed(4) + ')';
        heroTitle.style.opacity = clamp(1 - y / (vh * .9), 0, 1).toFixed(3);
        if (heroCard) heroCard.style.translate = '0 ' + (-y * .07).toFixed(1) + 'px';
        if (heroBg) heroBg.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0)';
      }
      pars.forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
        var k = parseFloat(el.getAttribute('data-par')) || 0;
        el.style.setProperty('--par', ((r.top + r.height / 2 - vh / 2) * k).toFixed(1) + 'px');
      });
      secs.forEach(function (s) {
        var r = s.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        s.style.setProperty('--gy', (-r.top * .08).toFixed(1) + 'px');
      });
      // marquee: constant drift + scroll velocity push + skew
      rowState.forEach(function (s) {
        s.x += s.dir * (.7 + Math.min(Math.abs(vel) * .35, 10));
        if (s.x <= -s.half) s.x += s.half;
        if (s.x > 0) s.x -= s.half;
        s.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,0,0)';
      });
      if (marq) marq.style.setProperty('--sk', clamp(vel * -.18, -6, 6).toFixed(2) + 'deg');
    }
    // timeline line drawing
    if (tl) {
      var r = tl.getBoundingClientRect();
      var tp = clamp((vh * .7 - r.top) / r.height, 0, 1);
      tl.style.setProperty('--p', RM ? 1 : tp.toFixed(4));
      var lim = tp * r.height + 10;
      tlLis.forEach(function (li) { li.classList.toggle('on', RM || li.offsetTop < lim); });
    }
    // section nav / rail state
    var cur = -1;
    secs.forEach(function (s, i) { var r = s.getBoundingClientRect(); if (r.top < vh * .45) cur = i; });
    navLinks.forEach(function (a) { a.classList.toggle('on', cur >= 0 && a.getAttribute('href') === '#' + secs[cur].id); });
    railLis.forEach(function (li, i) { li.classList.toggle('on', i === cur + 1); li.classList.toggle('past', i <= cur + 1); });
    // pill nav: hide on fast scroll down, show on scroll up
    if (topbar) {
      hideAcc = clamp(hideAcc + dy, -60, 80);
      topbar.classList.toggle('hide', hideAcc > 50 && y > vh * .6);
    }
    raf(frame);
  }
  raf(frame);

  /* ---------- smooth scrolling (notched wheels) + eased anchors ---------- */
  var animating = false;
  function scrollToY(target, dur) {
    var start = window.scrollY; target = clamp(target, 0, d.documentElement.scrollHeight - innerHeight);
    if (RM) { window.scrollTo(0, target); return; }
    var t0 = performance.now(); dur = dur || clamp(Math.abs(target - start) * .6, 600, 1400); animating = true;
    (function s(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      window.scrollTo(0, start + (target - start) * easeIO(p));
      if (p < 1 && animating) raf(s); else animating = false;
    })(t0);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1); var el = id === 'top' ? d.body : d.getElementById(id); if (!el) return;
    e.preventDefault();
    var y = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 64;
    scrollToY(y);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });
  railLis.forEach(function (li) { li.addEventListener('click', function () {
    var id = li.getAttribute('data-to'); scrollToY(id === 'top' ? 0 : $('#' + id).getBoundingClientRect().top + window.scrollY - 64);
  }); });
  if (FINE && !RM) {
    var target = window.scrollY, cur = target, smoothing = false;
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || introDone === false && de.classList.contains('intro')) return;
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      var notched = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Math.abs(e.deltaY % 1) < .001 && Math.abs(e.deltaY) % 4 === 0 && Math.abs(e.deltaY) <= 240);
      if (!notched) { if (!smoothing) target = window.scrollY; return; }
      e.preventDefault(); animating = false;
      if (!smoothing) { cur = window.scrollY; target = cur; }
      var max = d.documentElement.scrollHeight - innerHeight;
      target = clamp(target + e.deltaY * (e.deltaMode === 1 ? 34 : 1), 0, max);
      if (!smoothing) { smoothing = true; (function tick() {
        cur = lerp(cur, target, .11); window.scrollTo(0, cur);
        if (Math.abs(target - cur) > .4) raf(tick); else { smoothing = false; window.scrollTo(0, target); }
      })(); }
    }, { passive: false });
  }

  /* ---------- custom cursor with comet trail (fine pointers only) ---------- */
  var dot = $('.cursor-dot'), ring = $('.cursor-ring'), trail = $('.trail');
  if (dot && ring && FINE && !RM) {
    de.classList.add('has-cursor-css');
    var mx = -100, my = -100, rx = -100, ry = -100, dots = [], N = 12;
    for (var k = 0; k < N; k++) {
      var t = d.createElement('i'); var sz = 26 - k * 1.6; t.style.width = t.style.height = sz + 'px'; t.style.marginLeft = t.style.marginTop = (-sz / 2) + 'px';
      t.style.opacity = (1 - k / N) * .85; trail.appendChild(t); dots.push({ el: t, x: -100, y: -100 });
    }
    window.addEventListener('pointermove', function (ev) {
      mx = ev.clientX; my = ev.clientY; d.body.classList.add('has-cursor');
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    d.addEventListener('pointerleave', function () { d.body.classList.remove('has-cursor'); });
    d.addEventListener('pointerdown', function () { ring.classList.add('down'); });
    d.addEventListener('pointerup', function () { ring.classList.remove('down'); });
    (function loop() {
      rx = lerp(rx, mx, .16); ry = lerp(ry, my, .16);
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      var px = mx, py = my;
      dots.forEach(function (o, i) {
        o.x = lerp(o.x, px, .38); o.y = lerp(o.y, py, .38); px = o.x; py = o.y;
        o.el.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,' + o.y.toFixed(1) + 'px,0)';
      });
      raf(loop);
    })();
    var hoverSel = 'a, button, input, .card, .stat, .chips li, .hero-list li, .skill-group, .principles li';
    d.addEventListener('pointerover', function (ev) { if (ev.target.closest && ev.target.closest(hoverSel)) ring.classList.add('hover'); });
    d.addEventListener('pointerout', function (ev) { if (ev.target.closest && ev.target.closest(hoverSel)) ring.classList.remove('hover'); });
  }

  /* ---------- hover glow + tilt on cards, magnetic buttons, ripples ---------- */
  $$('.card, .skill-group, .stat, .hero-list li').forEach(function (c) {
    c.addEventListener('pointermove', function (ev) {
      var r = c.getBoundingClientRect(); var x = ev.clientX - r.left, y = ev.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (FINE && !RM && c.classList.contains('card')) {
        c.style.setProperty('--ry', ((x / r.width - .5) * 6).toFixed(2) + 'deg');
        c.style.setProperty('--rx', ((.5 - y / r.height) * 5).toFixed(2) + 'deg');
      }
    });
    c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
  var tilt = $('[data-hero-tilt]');
  if (tilt) {
    if (FINE && !RM) {
      tilt.addEventListener('pointermove', function (ev) {
        var r = tilt.getBoundingClientRect(); var x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
        tilt.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg'); tilt.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
        tilt.style.setProperty('--gx', ((x + .5) * 100) + '%'); tilt.style.setProperty('--gy', ((y + .5) * 100) + '%');
      });
      tilt.addEventListener('pointerleave', function () { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
    }
    // touch: tap the portrait to flip between the red look and natural colour
    tilt.addEventListener('pointerdown', function (ev) { if (ev.pointerType !== 'mouse') tilt.classList.toggle('color'); });
  }
  if (FINE && !RM) $$('.magnetic, .btn, .brand').forEach(function (b) {
    b.addEventListener('pointermove', function (ev) {
      var r = b.getBoundingClientRect();
      var x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
      b.style.transform = 'translate3d(' + (x * .28).toFixed(1) + 'px,' + (y * .4).toFixed(1) + 'px,0)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
  $$('.btn').forEach(function (b) {
    b.addEventListener('pointerdown', function (ev) {
      if (RM) return;
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
      var o = d.createElement('i'); o.className = 'ripple'; o.style.width = o.style.height = s + 'px';
      o.style.left = (ev.clientX - r.left - s / 2) + 'px'; o.style.top = (ev.clientY - r.top - s / 2) + 'px';
      b.appendChild(o); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 700);
    });
  });

  /* ---------- clock (Kerala is on IST) ---------- */
  var clock = $('#clock');
  function tickClock() {
    if (!clock) return;
    try { clock.textContent = 'Kerala · ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST'; } catch (e) {}
  }
  tickClock(); setInterval(tickClock, 20000);

  /* ---------- preview videos play only while on screen ---------- */
  var vids = $$('video.preview');
  if ('IntersectionObserver' in window && !RM) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  } else { vids.forEach(function (v) { v.pause(); }); }

  /* ---------- contact request: no backend on a static site, so this builds the
     message and opens his Instagram DM. Nothing is posted by this page. ---------- */
  var askBtn = d.getElementById('ask-btn');
  if (askBtn) {
    askBtn.addEventListener('click', function () {
      var name = (d.getElementById('ask-name').value || '').trim();
      var why = (d.getElementById('ask-why').value || '').trim();
      var msg = 'Hi Sudarshan, I would like your contact details' + (why ? ' for: ' + why : '') + '.' + (name ? ' - ' + name : '');
      var status = d.getElementById('ask-status');
      var open = function () { window.open('https://ig.me/m/sudarshan.4u', '_blank', 'noopener'); };
      var done = function (copied) {
        status.textContent = copied ? 'Message copied. Paste it into the Instagram DM that just opened.' : 'Opening the Instagram DM. Your message: ' + msg;
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(function () { open(); done(true); }, function () { open(); done(false); });
      } else { open(); done(false); }
    });
  }

  /* ---------- go ---------- */
  function boot() { runIntro(); }
  if (d.fonts && d.fonts.ready) { Promise.race([d.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(boot); } else { boot(); }
})();
