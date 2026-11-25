/* «Zamów do 13:00 — zwykle wyślemy dziś» under the delivery chip (.buy-trust) on product / set pages and the cart.
   Truthful by construction (measured 2026-11-19, analytics/sales/orders/pl-delivery-time): the warehouse (Fulfillment CZ)
   packs weekday orders placed before ~13:00 the same day; anything later or on a weekend / Polish public holiday goes
   the next working day. Time is read in Europe/Prague, never from the visitor's own zone. Public holidays: update HOL
   at the start of each year (Poland; Easter-based dates written out). Nothing is sent or stored. */
(function () {
  var CUTOFF = 13;
  var HOL = ['2026-11-11', '2026-12-24', '2026-12-25', '2026-12-26', '2027-01-01', '2027-01-06', '2027-03-28', '2027-03-29', '2027-05-01',
    '2027-05-03', '2027-05-16', '2027-05-27', '2027-08-15', '2027-11-01', '2027-11-11', '2027-12-24', '2027-12-25', '2027-12-26'];
  var DAY_ACC = { 1: 'w poniedziałek', 2: 'we wtorek', 3: 'w środę', 4: 'w czwartek', 5: 'w piątek' };

  function parts(d) {
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d), o = {};
    f.forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, iso: o.year + '-' + o.month + '-' + o.day };
  }
  function isWork(y, m, d) {
    var dt = new Date(Date.UTC(y, m - 1, d)), wd = dt.getUTCDay();
    var iso = y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
    return wd >= 1 && wd <= 5 && HOL.indexOf(iso) < 0;
  }
  /* now: Date → {today: bool, when: 'dziś' | 'jutro' | 'w piątek' …} */
  function ship(now) {
    var p = parts(now);
    if (isWork(p.y, p.m, p.d) && p.h < CUTOFF) return { today: true, when: 'dziś' };
    var dt = new Date(Date.UTC(p.y, p.m - 1, p.d)), n = 0;
    for (var i = 1; i < 14; i++) {
      var x = new Date(dt.getTime() + i * 86400000);
      if (isWork(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate())) { n = i; dt = x; break; }
    }
    return { today: false, when: n === 1 ? 'jutro' : DAY_ACC[dt.getUTCDay()] };
  }
  function text(r) {
    return r.today ? 'Zamów do ' + CUTOFF + ':00 — zwykle wyślemy dziś' : 'Zamów teraz — zwykle wyślemy ' + r.when;
  }
  window.shipCutoff = { ship: ship, text: text };

  function mount() {
    var box = document.querySelector('.buy-trust');
    if (!box || document.querySelector('.ship-cutoff')) return;
    var el = document.createElement('p');
    el.className = 'ship-cutoff';
    el.setAttribute('style', 'margin:8px 0 0;font-size:13px;font-weight:700;color:#5e2039');
    el.textContent = '📦 ' + text(ship(new Date()));
    box.parentNode.insertBefore(el, box.nextSibling);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
