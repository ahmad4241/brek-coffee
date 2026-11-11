(function () {
  // ------------------------------------------------ open / closed, Geneva time
  // day: 0 = Sunday ... 6 = Saturday; [open, close] in hours
  var HOURS = { 0: [10, 18], 1: null, 2: [8, 17], 3: [8, 17], 4: [8, 17], 5: [8, 17], 6: [10, 18] };
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function genevaNow() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { day: day, h: (+p.hour % 24) + (+p.minute) / 60 };
  }
  function hh(h) { return (h < 10 ? '0' : '') + h + ':00'; }
  function status() {
    var now = genevaNow(), today = HOURS[now.day], el = document.getElementById('status'), txt = document.getElementById('status-text');
    var open = today && now.h >= today[0] && now.h < today[1];
    if (el) {
    el.classList.toggle('open', !!open);
    if (open) { txt.textContent = 'Ouvert · jusqu’à ' + hh(today[1]); }
    else {
      for (var k = 0; k < 8; k++) {
        var d = (now.day + k) % 7, hs = HOURS[d];
        if (hs && (k > 0 || now.h < hs[0])) {
          txt.textContent = 'Fermé · ' + (k === 0 ? '' : k === 1 ? 'demain ' : DAYS[d] + ' ') + hh(hs[0]);
          break;
        }
      }
    }
    }
    document.querySelectorAll('.hours tr').forEach(function (tr) { tr.classList.toggle('today', tr.dataset.day.split(' ').indexOf(String(now.day)) > -1); });
  }
  status(); setInterval(status, 60000);

  // ------------------------------------------------ nav border once scrolled
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ------------------------------------------------ phone menu (full screen)
  var burger = document.getElementById('burger'), ov = document.getElementById('menu-ov');
  function menu(open) {
    ov.hidden = !open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Menu');
    document.documentElement.classList.toggle('ov-open', open);
  }
  burger.addEventListener('click', function () { menu(ov.hidden); });
  ov.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) menu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) { menu(false); burger.focus(); } });

  // ------------------------------------------------ the bird draws itself (footer on arrival, menu on open)
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // one stroke per outline, so every line draws at once (browsers restart dashes per outline)
    [].forEach.call(document.querySelectorAll('svg.drw'), function (svg) {
      var dp = svg.querySelector('.draw'), g = document.createElementNS(dp.namespaceURI, 'g');
      dp.getAttribute('d').split(/(?=M)/).forEach(function (d) {
        var p = document.createElementNS(dp.namespaceURI, 'path');
        p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.setAttribute('class', 'lnd'); g.appendChild(p);
      });
      svg.appendChild(g);
    });
    document.documentElement.classList.add('js-draw');
    var brand = document.querySelector('.f-brand');
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { brand.classList.add('in'); brand.querySelector('.drw').classList.add('in'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(brand);
    var ovLock = document.querySelector('.ov-lock');
    burger.addEventListener('click', function () {
      ovLock.classList.remove('in');
      if (!ov.hidden) { void ovLock.getBoundingClientRect(); setTimeout(function () { ovLock.classList.add('in'); }, 250); }
    });
  }

  // ------------------------------------------------ le croffle: labels draw in; a slice or a name opens its order
  var cf = document.querySelector('.croffle');
  if (cf) {
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('js-cf');
      // the four slices start spread out on one line and close up together; the names come in as they land
      var box = cf.querySelector('.cf-pieces'), DUR = 1400, anims = [];
      var FROM = [[-.26, 0, 0], [-.09, 0, 0], [.09, 0, 0], [.26, 0, 0]];
      if (box && box.animate) {
        var w = box.clientWidth, h = box.clientHeight;
        anims = [].map.call(box.querySelectorAll('.cf-s'), function (el, i) {
          var f = FROM[i], a = el.animate([
            { transform: 'translate(' + f[0] * w + 'px,' + f[1] * h + 'px) rotate(' + f[2] + 'deg)' },
            { transform: 'none' }], { duration: DUR, delay: i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
          a.pause();
          return a;
        });
      }
      var cio = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        cio.disconnect();
        if (!anims.length) { cf.classList.add('in'); return; }
        anims.forEach(function (a) { a.play(); });
        setTimeout(function () { cf.classList.add('in'); }, DUR * .7);
      }, { threshold: box ? 0.6 : 0.3 });
      cio.observe(box || cf);
    }
    cf.addEventListener('click', function (e) {
      var b = e.target.closest('[data-order]');
      if (b && window.brekOpenItem) window.brekOpenItem(b.dataset.order);
    });
  }

  // ------------------------------------------------ keep the page at 100 % on phones
  // Safari keeps a zoom level per tab (after a pinch or a focused field) and then the
  // whole page slides left and right. Re-applying the viewport resets it to 1.
  var vp = document.querySelector('meta[name=viewport]'), VP = vp.content;
  function unzoom() {
    if (window.visualViewport && visualViewport.scale <= 1.01) return;
    vp.content = VP + ', user-scalable=no';
    setTimeout(function () { vp.content = VP; }, 300);
  }
  addEventListener('pageshow', unzoom);
  addEventListener('orientationchange', unzoom);
  document.addEventListener('focusout', function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) setTimeout(unzoom, 50); });
  document.addEventListener('close', unzoom, true);
  if (window.visualViewport) visualViewport.addEventListener('resize', function () { clearTimeout(unzoom.t); unzoom.t = setTimeout(unzoom, 400); });
  // no pinch-zoom on the page itself (Safari ignores maximum-scale for pinch)
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
})();
