(function () {
  // ------------------------------------------------ livre d'or: list published messages, send new ones for review
  var API = 'api/avis.php';
  var list = document.getElementById('av-list'), form = document.getElementById('av-form');
  if (!list || !form) return;
  var msg = document.getElementById('av-msg'), count = document.getElementById('av-count');
  var rate = 5, opened = Date.now();
  var fName = document.getElementById('av-name'), fText = document.getElementById('av-text'), fHp = form.querySelector('.hp');
  var STAR = '<svg class="ic" aria-hidden="true"><use href="#i-star"/></svg>';
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(d) { var p = d.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= n ? 'on' : '') + '">' + STAR + '</span>'; return s; }

  function render(items) {
    if (!items.length) {
      list.innerHTML = '<li class="av-empty">Soyez le premier à laisser un mot.</li>';
      return;
    }
    list.innerHTML = items.map(function (i) {
      return '<li class="av-card"><div class="av-stars" aria-label="' + i.rating + ' sur 5">' + stars(i.rating) + '</div>' +
        '<p>' + esc(i.text) + '</p><footer><b>' + esc(i.name) + '</b><span>' + when(i.date) + '</span></footer></li>';
    }).join('');
  }
  function load() {
    fetch(API, { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (d) { render(d.items || []); })
      .catch(function () { render([]); });
  }

  // star picker
  var btns = [].slice.call(form.querySelectorAll('.av-rate button'));
  function setRate(v) {
    rate = v;
    btns.forEach(function (b) { var n = +b.dataset.v; b.classList.toggle('on', n <= v); b.setAttribute('aria-checked', n === v); });
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { setRate(+b.dataset.v); }); });
  setRate(5);

  fText.addEventListener('input', function () { count.textContent = fText.value.length + ' / 500'; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'av-msg'; msg.textContent = '';
    var name = fName.value.trim(), text = fText.value.trim();
    if (name.length < 2) { msg.textContent = 'Ajoutez votre prénom.'; fName.focus(); return; }
    if (text.length < 5) { msg.textContent = 'Votre message est un peu court.'; fText.focus(); return; }
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, text: text, rating: rate, website: fHp.value, t: opened })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.d.error || 'Oups, réessayez plus tard.');
        form.reset(); setRate(5); count.textContent = '0 / 500';
        msg.className = 'av-msg ok';
        msg.textContent = 'Merci ' + name + ' ! Votre mot apparaîtra ici après validation.';
      })
      .catch(function (err) { msg.textContent = err.message || 'Oups, réessayez plus tard.'; })
      .then(function () { btn.disabled = false; });
  });

  load();
})();
