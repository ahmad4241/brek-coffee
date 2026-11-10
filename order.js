(function () {
  // --------------------------------------------------------------- config
  // The shop's WhatsApp number, international format without + (e.g. 41791234567).
  // Left empty for the demo: WhatsApp then opens with the message and lets you pick the chat.
  var WHATSAPP = document.body.getAttribute('data-whatsapp') || '';
  var LEAD_MIN = 15, STEP_MIN = 10;
  var HOURS = { 0: [10, 18], 1: null, 2: [8, 17], 3: [8, 17], 4: [8, 17], 5: [8, 17], 6: [10, 18] };
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  var DATA = JSON.parse(document.getElementById('menu-data').textContent);
  var ITEMS = {}; DATA.items.forEach(function (i) { ITEMS[i.id] = i; });
  var $ = function (id) { return document.getElementById(id); };
  var chf = function (n) { return 'CHF ' + n.toFixed(2); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // --------------------------------------------------------------- filters
  var chips = [].slice.call(document.querySelectorAll('.filters .chip'));
  var groups = [].slice.call(document.querySelectorAll('.groups .group'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.dataset.filter;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
      groups.forEach(function (g) { g.hidden = f !== 'all' && g.dataset.cat !== f; });
      var top = document.querySelector('.filters').getBoundingClientRect().top;
      if (top < 0 || top > 120) document.querySelector('.filters').scrollIntoView({ block: 'start' });
    });
  });

  // --------------------------------------------------------------- cart (kept in this browser only)
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('brek-cart') || '[]').filter(function (l) { return ITEMS[l.id]; }); } catch (e) { cart = []; }
  function save() { try { localStorage.setItem('brek-cart', JSON.stringify(cart)); } catch (e) {} }
  function unit(l) { var it = ITEMS[l.id]; return it.price + (l.oat ? DATA.addon : 0) + (l.foam ? DATA.addon : 0); }
  function total() { return cart.reduce(function (s, l) { return s + unit(l) * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function details(l) {
    return [{ Iced: 'glacé', Hot: 'chaud' }[l.temp] || '', l.choice, l.oat ? 'lait d’avoine' : '', l.foam ? 'cold foam vanille' : ''].concat(l.notes || []).concat(l.note ? [l.note] : [])
      .filter(Boolean).join(' · ');
  }
  function sameLine(a, b) { return a.id === b.id && details(a) === details(b); }

  var bar = $('cartbar');
  function renderBar() {
    var n = count();
    bar.hidden = n === 0;
    $('cb-n').textContent = n;
    $('cb-total').textContent = chf(total());
  }

  // --------------------------------------------------------------- item sheet
  var sheet = $('item-sheet'), form = $('item-form'), cur = null, qty = 1;
  function seg(name, label, opts, def) {
    return '<fieldset class="opt"><legend>' + label + '</legend><div class="seg">' + opts.map(function (o, i) {
      var v = typeof o === 'string' ? o : o[0], t = typeof o === 'string' ? o : o[1];
      return '<label><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (v === def ? ' checked' : '') + '><span>' + t + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function openItem(id) {
    var it = ITEMS[id]; cur = it; qty = 1;
    var c = DATA.cats[it.cat].color;
    $('is-pic').style.setProperty('--c', c);
    $('is-pic').innerHTML = it.img ? '<img src="images/' + it.img + '-600.webp" alt="" width="600" height="474">'
      : '<svg class="ph" aria-hidden="true"><use href="#mascot"/></svg>';
    $('is-name').innerHTML = esc(it.name) + ' <span class="is-price">' + it.price.toFixed(2) + '</span>';
    $('is-desc').textContent = it.desc + (it.size ? ' · ' + it.size : '');
    var o = '';
    if (it.temp === 'both') o += seg('temp', 'Température', [['Iced', 'Glacé'], ['Hot', 'Chaud']], 'Iced');
    if (it.choice) o += seg('choice', it.choice[0], it.choice[1], it.choice[1][0]);
    if (it.milk) o += seg('milk', 'Lait', [['normal', 'Normal'], ['oat', 'Avoine <small>+0.50</small>']], 'normal');
    if (it.foam) o += '<fieldset class="opt"><legend>Extra</legend><label class="check"><input type="checkbox" name="foam"><span>Vanilla cold foam <small>+0.50</small></span></label></fieldset>';
    $('is-opts').innerHTML = o;
    var notes = ['Sans sucre', 'Peu sucré'];
    if (it.temp === 'iced' || it.temp === 'both') notes.push('Peu de glaçons');
    if (it.temp === 'hot' || it.temp === 'both') notes.push('Bien chaud');
    if (it.cat === 'miam') notes = ['Bien croustillant', 'Coupé en deux'];
    $('is-notes').innerHTML = notes.map(function (n) {
      return '<label class="note"><input type="checkbox" name="notes" value="' + n + '"><span>' + n + '</span></label>';
    }).join('');
    $('is-note').value = '';
    refresh();
    sheet.showModal();
  }
  function readLine() {
    var f = new FormData(form), it = cur;
    var temp = it.temp === 'both' ? (f.get('temp') === 'Hot' ? 'Hot' : 'Iced') : it.temp === 'iced' ? 'Iced' : '';
    return {
      id: it.id, qty: qty, temp: temp, choice: it.choice ? f.get('choice') : '',
      oat: f.get('milk') === 'oat', foam: !!f.get('foam'),
      notes: f.getAll('notes'), note: ($('is-note').value || '').trim().slice(0, 60)
    };
  }
  function refresh() {
    var l = readLine();
    $('is-qty').textContent = qty;
    $('is-add').textContent = 'Ajouter · ' + chf(unit(l) * qty);
  }
  form.addEventListener('change', refresh);
  sheet.querySelectorAll('.qty button').forEach(function (b) {
    b.addEventListener('click', function () { qty = Math.max(1, Math.min(20, qty + +b.dataset.q)); refresh(); });
  });
  form.addEventListener('submit', function (e) {
    if (e.submitter && e.submitter.value === 'cancel') return;
    var l = readLine();
    var same = cart.filter(function (x) { return sameLine(x, l); })[0];
    if (same) same.qty = Math.min(20, same.qty + l.qty); else cart.push(l);
    save(); renderBar();
    bar.classList.remove('pop'); void bar.offsetWidth; bar.classList.add('pop');
  });
  document.querySelectorAll('.card-btn').forEach(function (b) {
    b.addEventListener('click', function () { openItem(b.dataset.item); });
  });
  [sheet, $('cart-sheet')].forEach(function (d) {      // click on the backdrop closes
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });

  // --------------------------------------------------------------- pickup slots (Geneva time)
  function genevaNow() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: (+p.hour % 24) * 60 + (+p.minute) };
  }
  function hm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function slots() {
    var now = genevaNow();
    for (var k = 0; k < 8; k++) {
      var d = (now.day + k) % 7, hs = HOURS[d];
      if (!hs) continue;
      var open = hs[0] * 60, last = hs[1] * 60 - STEP_MIN;
      var start = k === 0 ? Math.max(open + STEP_MIN, now.min + LEAD_MIN) : open + STEP_MIN;
      start = Math.ceil(start / STEP_MIN) * STEP_MIN;
      if (start > last) continue;
      var dayLabel = k === 0 ? 'Aujourd’hui' : k === 1 ? 'Demain' : DAYS[d].charAt(0).toUpperCase() + DAYS[d].slice(1);
      var list = [];
      for (var m = start; m <= last; m += STEP_MIN) list.push({ v: dayLabel + ' ' + hm(m), t: dayLabel + ' à ' + hm(m) });
      var openNow = k === 0 && now.min >= open && now.min < hs[1] * 60;
      if (openNow) list[0].t = 'Dès que possible (vers ' + hm(start) + ')';
      return { list: list, closed: !openNow, label: dayLabel };
    }
    return { list: [], closed: true, label: '' };
  }

  // --------------------------------------------------------------- cart sheet
  var cs = $('cart-sheet');
  function renderCart() {
    $('cs-lines').innerHTML = cart.map(function (l, i) {
      var it = ITEMS[l.id];
      return '<li><div class="ln"><b lang="en">' + esc(it.name) + '</b><span class="muted">' + esc(details(l)) + '</span></div>' +
        '<div class="qty sm" role="group" aria-label="Quantité ' + esc(it.name) + '"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Moins">−</button><output>' + l.qty +
        '</output><button type="button" data-i="' + i + '" data-d="1" aria-label="Plus">+</button></div><b class="lp">' + (unit(l) * l.qty).toFixed(2) + '</b></li>';
    }).join('');
    $('cs-total').textContent = chf(total());
    renderBar();
    if (!cart.length) cs.close();
  }
  $('cs-lines').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var l = cart[+b.dataset.i]; l.qty += +b.dataset.d;
    if (l.qty <= 0) cart.splice(+b.dataset.i, 1);
    save(); renderCart();
  });
  function openCart() {
    $('cs-main').hidden = false; $('cs-foot').hidden = false; $('cs-done').hidden = true; $('cs-err').textContent = '';
    var s = slots();
    $('cs-slot').innerHTML = s.list.map(function (o) { return '<option value="' + o.v + '">' + o.t + '</option>'; }).join('');
    $('cs-closed').hidden = !s.closed;
    $('cs-closed').textContent = s.closed ? 'Nous sommes fermés pour le moment : votre commande sera prête ' + s.label.toLowerCase() + '.' : '';
    try { $('cs-name').value = localStorage.getItem('brek-name') || $('cs-name').value; } catch (e) {}
    renderCart();
    cs.showModal();
  }
  bar.addEventListener('click', openCart);

  function message(name, phone, slot) {
    var lines = cart.map(function (l) {
      var d = details(l);
      return '• ' + l.qty + '× ' + ITEMS[l.id].name + (d ? ' (' + d + ')' : '') + ' : CHF ' + (unit(l) * l.qty).toFixed(2);
    });
    return ['Bonjour BREK ! Commande à emporter', '', 'Retrait : ' + slot, 'Nom : ' + name + (phone ? ' · ' + phone : ''), '']
      .concat(lines).concat(['', 'Total : ' + chf(total()) + ' · paiement au comptoir']).join('\n');
  }
  $('cs-send').addEventListener('click', function () {
    var name = $('cs-name').value.trim(), phone = $('cs-phone').value.trim(), slot = $('cs-slot').value;
    if (!name) { $('cs-err').textContent = 'Ajoutez votre prénom pour qu’on vous appelle au comptoir.'; $('cs-name').focus(); return; }
    if (!slot) { $('cs-err').textContent = 'Aucun créneau disponible pour le moment.'; return; }
    try { localStorage.setItem('brek-name', name); } catch (e) {}
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message(name, phone, slot));
    window.open(url, '_blank', 'noopener');
    $('cs-main').hidden = true; $('cs-foot').hidden = true; $('cs-done').hidden = false;
    $('cs-done-txt').textContent = 'Votre commande s’ouvre dans WhatsApp : envoyez le message et on la prépare pour ' + slot.toLowerCase().replace(' ', ' à ') + '.';
  });
  $('cs-new').addEventListener('click', function () { cart = []; save(); renderBar(); cs.close(); });

  renderBar();
})();
