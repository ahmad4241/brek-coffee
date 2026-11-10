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
    document.querySelectorAll('.hours tr').forEach(function (tr) { tr.classList.toggle('today', +tr.dataset.day === now.day); });
  }
  status(); setInterval(status, 60000);

  // ------------------------------------------------ nav border once scrolled
  var nav = document.querySelector('.nav');
  addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 8); }, { passive: true });

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
