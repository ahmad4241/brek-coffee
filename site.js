(function () {
  // ------------------------------------------------ drink switcher (hero)
  var NOTES = {
    'vanilla-matcha': 'Matcha Okumidori bio, cold foam vanille maison · <b>CHF 7.50</b>',
    'cinnamon-latte': 'Espresso 100 % arabica, sirop cannelle maison · <b>CHF 7.00</b>',
    'strawberry-matcha': 'Matcha bio et fraise, servi glacé · <b>CHF 8.00</b>'
  };
  var body = document.body, note = document.getElementById('drink-note');
  var tabs = [].slice.call(document.querySelectorAll('.switch button'));
  var imgs = [].slice.call(document.querySelectorAll('.glass img'));
  function pick(name) {
    body.setAttribute('data-drink', name);
    tabs.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.drink === name); });
    imgs.forEach(function (im) { im.classList.toggle('on', im.dataset.for === name); });
    note.innerHTML = NOTES[name];
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { pick(b.dataset.drink); });
  });

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
          txt.textContent = 'Fermé · ouvre ' + (k === 0 ? 'à ' : k === 1 ? 'demain à ' : DAYS[d] + ' à ') + hh(hs[0]);
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
})();
