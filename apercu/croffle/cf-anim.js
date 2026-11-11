// Aperçu : le croffle arrive en morceaux puis se rassemble.
(function () {
  var MODE = document.documentElement.dataset.cf; // fan | scatter | scroll
  var sec = document.querySelector('.croffle'), box = document.querySelector('.cf-pieces');
  if (!sec || !box) return;
  var P = [].slice.call(box.querySelectorAll('.cf-s'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // départ de chaque morceau, en fraction de la largeur / hauteur de l'image
  var FROM = MODE === 'fan'
    ? [[-.26, 0, 0], [-.09, 0, 0], [.09, 0, 0], [.26, 0, 0]]
    : [[-.2, -.3, -16], [-.06, .34, 11], [.07, -.36, -9], [.21, .28, 14]];
  var DUR = MODE === 'fan' ? 1400 : 1500;
  var EASE = MODE === 'fan' ? 'cubic-bezier(.2,.8,.2,1)' : 'cubic-bezier(.2,1.12,.35,1)';
  var anims = [];
  function build() {
    anims.forEach(function (a) { a.cancel(); });
    var w = box.clientWidth, h = box.clientHeight;
    anims = P.map(function (el, i) {
      var f = FROM[i];
      var k = [
        { transform: 'translate(' + f[0] * w + 'px,' + f[1] * h + 'px) rotate(' + f[2] + 'deg)', opacity: 1, offset: 0 },
        { transform: 'none', opacity: 1, offset: 1 }];
      var a = el.animate(k, { duration: DUR, delay: MODE === 'scroll' ? 0 : i * 70, easing: MODE === 'scroll' ? 'linear' : EASE, fill: 'both' });
      a.pause();
      return a;
    });
  }
  function done() { sec.classList.add('built'); }
  if (reduce || !box.animate) { done(); return; }
  build();

  if (MODE === 'scroll') {
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var tick = function () {
      var r = box.getBoundingClientRect(), vh = innerHeight;
      // 0 quand le haut de l'image entre en bas de l'écran, 1 quand l'image est bien au milieu
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * .55)));
      var e = ease(p);
      anims.forEach(function (a, i) { a.currentTime = Math.min(DUR, Math.max(0, (e * 1.18 - i * .06)) * DUR); });
      sec.classList.toggle('built', p >= 1);
    };
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', function () { build(); tick(); });
    tick();
    return;
  }

  function play() {
    sec.classList.remove('built');
    anims.forEach(function (a) { a.currentTime = 0; a.play(); });
    setTimeout(done, MODE === 'fan' ? DUR * .7 : DUR * .62);
  }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: .6 });
  io.observe(box);
  var again = document.querySelector('.cf-again');
  if (again) again.addEventListener('click', function () { build(); play(); });
})();

// avec <base href="../../">, les liens #ancre restent sur cette page
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  location.hash = a.getAttribute('href');
}, true);
