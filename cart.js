/* Centrum Bolotova — client-side cart (localStorage).
   Handles add/update/remove, Balzam 500 ml quantity tiers, header counter badge,
   and an add-to-cart toast. Stripe charging is wired separately (needs keys). */
(function () {
  var CATALOG = {
    'balzam-250':            { name: 'Balzam Bolotova 250 ml', price: 149, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html' },
    'balzam-500':            { name: 'Balzam Bolotova 500 ml', price: 193, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html',
                               tiers: [{ min: 6, price: 153 }, { min: 3, price: 163 }, { min: 1, price: 193 }] },
    'kolagen':               { name: 'Kolagen by Bolotov', price: 279, img: 'assets/img/prod-kolagen.png', url: 'kolagen-by-bolotov.html' },
    'l-glutamine':           { name: 'L-Glutamine Gastric Restore Complex', price: 116, img: 'assets/img/prod-lglutamine.png', url: 'l-glutamine.html' },
    'hyaluronic':            { name: 'Hyaluronic Acid + Vitamin C', price: 116, img: 'assets/img/prod-hyaluronic.png', url: 'hyaluronic-acid-vitamin-c.html' },
    'biotin':                { name: 'Biotin Zinc Selenium', price: 69, img: 'assets/img/prod-biotin.png', url: 'biotin-zinc-selenium.html' },
    'set-beauty-base':       { name: 'Set Beauty Base System', price: 326, orig: 391, img: 'assets/img/sets/beauty-1.png', url: 'set-beauty-base.html' },
    'set-refluks-zgaga':     { name: 'Set Program na Refluks i Zgagę', price: 281, orig: 354, img: 'assets/img/sets/refluks-1.png', url: 'set-refluks-zgaga.html' },
    'set-ciezkosc-wzdecia':  { name: 'Set Program na Uczucie Ciężkości i Wzdęcia', price: 209, orig: 233, img: 'assets/img/sets/ciezkosc-1.png', url: 'set-ciezkosc-wzdecia.html' },
    'set-trawienie-stawy':   { name: 'Set Trawienie & Stawy', price: 409, orig: 470, img: 'assets/img/sets/trawienie-1.png', url: 'set-trawienie-stawy.html' },
    'set-kuracja-kolagenowa':{ name: 'Set Intensywna Kuracja Kolagenowa', price: 687, orig: 827, img: 'assets/img/sets/kuracja-1.png', url: 'set-kuracja-kolagenowa.html' },
    'set-restart':           { name: 'Set Bolotov Restart Program', price: 856, orig: 1018, img: 'assets/img/sets/restart-1.png', url: 'set-restart.html' }
  };

  /* Set compositions — which single products (and how many) make up each set.
     Used to cross-sell: when the cart holds products that form a set, offer the cheaper bundle.
     (Verified against each set's "Skład zestawu" and its struck-through regular price.) */
  var SETS = {
    'set-beauty-base':        { 'kolagen': 1, 'hyaluronic': 1 },
    'set-refluks-zgaga':      { 'balzam-500': 1, 'l-glutamine': 1 },
    'set-ciezkosc-wzdecia':   { 'balzam-500': 1 },
    'set-trawienie-stawy':    { 'balzam-500': 1, 'kolagen': 1 },
    'set-kuracja-kolagenowa': { 'kolagen': 3 },
    'set-restart':            { 'balzam-500': 1, 'kolagen': 3 }
  };

  var KEY = 'bolotov_cart_v1';

  /* GTM dataLayer push (GA4 e-commerce). Safe pre-consent — tags are gated by Consent Mode. */
  function dl(o) { try { (window.dataLayer = window.dataLayer || []).push(o); } catch (e) {} }
  function ecomItem(id, qty) {
    var p = CATALOG[id]; if (!p) return null;
    return { item_id: id, item_name: p.name, price: unitPrice(id, qty || 1), quantity: qty || 1 };
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    renderBadge();
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  function unitPrice(id, qty) {
    var p = CATALOG[id];
    if (!p) return 0;
    if (p.tiers) {
      for (var i = 0; i < p.tiers.length; i++) {
        if (qty >= p.tiers[i].min) return p.tiers[i].price;
      }
    }
    return p.price;
  }

  // Regular (pre-discount) unit price: set "orig", or for tiered items the 1-unit tier price.
  function regularUnit(id) {
    var p = CATALOG[id];
    if (!p) return 0;
    if (p.orig) return p.orig;
    if (p.tiers) return p.tiers[p.tiers.length - 1].price; // tier with min:1
    return p.price;
  }
  // Next quantity tier that lowers the unit price: how many more units and the resulting price.
  function nextTier(id, qty) {
    var p = CATALOG[id];
    if (!p || !p.tiers) return null;
    var cur = unitPrice(id, qty);
    var asc = p.tiers.slice().sort(function (a, b) { return a.min - b.min; });
    for (var i = 0; i < asc.length; i++) {
      if (asc[i].min > qty && asc[i].price < cur) {
        return { need: asc[i].min - qty, min: asc[i].min, price: asc[i].price };
      }
    }
    return null;
  }
  // Money saved on a line vs the regular price.
  function lineSavings(id, qty) {
    return Math.max(0, (regularUnit(id) - unitPrice(id, qty)) * qty);
  }

  // Map of product id -> total quantity currently in the cart.
  function qtyMap() {
    var m = {};
    read().forEach(function (i) { m[i.id] = (m[i.id] || 0) + i.qty; });
    return m;
  }

  /* Cross-sell: inspect the cart and return the single best set worth suggesting, or null.
     Two cases are covered:
       - complete  -> the cart already holds every product the set needs (offer a swap to save);
       - partial   -> the cart holds part of a set (offer to complete it as the cheaper bundle).
     A suggestion is returned only when the set is genuinely cheaper than buying the parts, and
     (for partials) only when the cart already covers at least half of the set's distinct products,
     so a single common product can't trigger spammy, far-fetched offers. */
  function suggestSet() {
    var q = qtyMap();
    if (!Object.keys(q).length) return null;
    var best = null;
    Object.keys(SETS).forEach(function (setId) {
      if (q[setId]) return;                       // this set is already in the cart
      var comp = SETS[setId];
      var prods = Object.keys(comp);
      var presentTypes = 0, partsPrice = 0, addCost = 0, missing = [];
      prods.forEach(function (pid) {
        var need = comp[pid];
        var have = q[pid] || 0;
        if (have > 0) presentTypes++;
        var used = Math.min(have, need);
        if (used > 0) partsPrice += unitPrice(pid, have) * used;   // what they pay for these now
        var lack = need - used;
        if (lack > 0) {
          var extra = regularUnit(pid) * lack;
          partsPrice += extra; addCost += extra;                  // cost to complete the set
          missing.push({ id: pid, qty: lack });
        }
      });
      if (presentTypes === 0) return;             // cart holds nothing from this set
      var setPrice = CATALOG[setId].price;
      var saving = partsPrice - setPrice;
      if (saving <= 0) return;                     // set isn't actually cheaper -> skip
      var complete = missing.length === 0;
      if (!complete && presentTypes < Math.ceil(prods.length / 2)) return;  // too little overlap
      var cand = {
        setId: setId, name: CATALOG[setId].name, url: CATALOG[setId].url,
        complete: complete, missing: missing,
        saving: saving, setPrice: setPrice, partsPrice: partsPrice,
        addCost: addCost                          // 0 for complete sets -> they rank first
      };
      // Prefer the easiest set to complete (smallest extra spend); tie-break by larger saving.
      if (!best || cand.addCost < best.addCost || (cand.addCost === best.addCost && cand.saving > best.saving)) best = cand;
    });
    return best;
  }

  /* Short composition of a set, e.g. "Kolagen by Bolotov + Hyaluronic Acid + Vitamin C".
     Used in the cart so the customer can see what a bundle contains. Null for non-sets. */
  function setContents(id) {
    var comp = SETS[id];
    if (!comp) return null;
    return Object.keys(comp).map(function (pid) {
      var p = CATALOG[pid]; if (!p) return '';
      return comp[pid] > 1 ? p.name + ' ×' + comp[pid] : p.name;
    }).filter(Boolean).join(' + ');
  }

  /* Replace a set's constituent products in the cart with the set SKU itself.
     Decrements each component by the quantity the set needs (keeping any surplus) and adds 1 set. */
  function convertToSet(setId) {
    if (!CATALOG[setId] || !SETS[setId]) return;
    var q = qtyMap();
    var comp = SETS[setId];
    var items = read();
    Object.keys(comp).forEach(function (pid) {
      var keep = Math.max(0, (q[pid] || 0) - comp[pid]);
      items = items.filter(function (i) { return i.id !== pid; });
      if (keep > 0) items.push({ id: pid, qty: keep });
    });
    var row = items.filter(function (i) { return i.id === setId; })[0];
    if (row) { row.qty += 1; } else { items.push({ id: setId, qty: 1 }); }
    write(items);
    dl({ ecommerce: null });
    dl({ event: 'select_set', ecommerce: { currency: 'PLN', value: CATALOG[setId].price, items: [ecomItem(setId, 1)] } });
  }

  /* Promo codes — a percentage discount limited to a product scope (case-insensitive).
     Can be entered in the cart or auto-applied via a link (?promo=CODE). Only ONE code is
     active at a time, stored in localStorage. The discount applies only to the listed product
     ids; everything else stays full price. NOTE: this is the visible/cart-side discount — the
     final charge must ALSO be enforced server-side at payment (Stripe) once keys are wired. */
  var PROMOS = {
    'balsam':   { percent: 10, scope: ['balzam-250', 'balzam-500'], label: '−10% na Balzam' },
    'balsam15': { percent: 15, scope: ['balzam-250', 'balzam-500'], label: '−15% na Balzam' }
  };
  var PROMO_KEY = 'bolotov_promo_v1';
  function normPromo(code) { return (code || '').trim().toLowerCase(); }
  function activePromo() {
    try { var c = localStorage.getItem(PROMO_KEY); return c && PROMOS[c] ? c : null; } catch (e) { return null; }
  }
  function applyPromo(code) {
    code = normPromo(code);
    if (!PROMOS[code]) return false;
    try { localStorage.setItem(PROMO_KEY, code); } catch (e) {}
    dl({ event: 'select_promotion', promotion_id: code, discount_percent: PROMOS[code].percent });
    document.dispatchEvent(new CustomEvent('cart:change'));
    return true;
  }
  function clearPromo() {
    try { localStorage.removeItem(PROMO_KEY); } catch (e) {}
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  // Money taken off one line by the active promo (0 if no code / product out of scope).
  function promoLineDiscount(id, qty) {
    var c = activePromo(); if (!c) return 0;
    var p = PROMOS[c];
    if (p.scope.indexOf(id) < 0) return 0;
    return Math.round(unitPrice(id, qty) * qty * p.percent) / 100;   // 2-dp, avoids float artifacts
  }
  function promoSavings() {
    return read().reduce(function (s, i) { return s + promoLineDiscount(i.id, i.qty); }, 0);
  }

  var Cart = {
    CATALOG: CATALOG,
    SETS: SETS,
    PROMOS: PROMOS,
    items: read,
    unitPrice: unitPrice,
    regularUnit: regularUnit,
    nextTier: nextTier,
    lineSavings: lineSavings,
    suggestSet: suggestSet,
    convertToSet: convertToSet,
    setContents: setContents,
    activePromo: activePromo,
    applyPromo: applyPromo,
    clearPromo: clearPromo,
    promoLineDiscount: promoLineDiscount,
    promoSavings: promoSavings,
    add: function (id, qty) {
      if (!CATALOG[id]) { return; }
      qty = qty || 1;
      var items = read();
      var row = items.filter(function (i) { return i.id === id; })[0];
      if (row) { row.qty += qty; } else { items.push({ id: id, qty: qty }); }
      write(items);
      dl({ ecommerce: null });
      dl({ event: 'add_to_cart', ecommerce: { currency: 'PLN', value: unitPrice(id, qty) * qty, items: [ecomItem(id, qty)] } });
      notify(id, qty);
    },
    setQty: function (id, qty) {
      var items = read().map(function (i) { return i.id === id ? { id: id, qty: qty } : i; })
                        .filter(function (i) { return i.qty > 0; });
      write(items);
    },
    remove: function (id) {
      var cur = read().filter(function (i) { return i.id === id; })[0];
      if (cur) {
        dl({ ecommerce: null });
        dl({ event: 'remove_from_cart', ecommerce: { currency: 'PLN', value: unitPrice(id, cur.qty) * cur.qty, items: [ecomItem(id, cur.qty)] } });
      }
      write(read().filter(function (i) { return i.id !== id; }));
    },
    clear: function () { write([]); },
    count: function () { return read().reduce(function (s, i) { return s + i.qty; }, 0); },
    subtotal: function () {
      return read().reduce(function (s, i) { return s + unitPrice(i.id, i.qty) * i.qty; }, 0);
    },
    savings: function () {
      return read().reduce(function (s, i) { return s + lineSavings(i.id, i.qty); }, 0);
    }
  };
  window.Cart = Cart;

  /* Auto-apply a promo from a link, e.g. ...?promo=balsam15 — works site-wide and persists. */
  (function () {
    try {
      var m = /[?&]promo=([^&#]+)/i.exec(location.search);
      if (m) applyPromo(decodeURIComponent(m[1]));
    } catch (e) {}
  })();

  /* Header counter badge — updates the "Koszyk" link on every page. */
  function renderBadge() {
    var n = Cart.count();
    var links = document.querySelectorAll('.header-actions a[href="koszyk.html"]');
    for (var i = 0; i < links.length; i++) {
      links[i].textContent = n > 0 ? 'Koszyk (' + n + ')' : 'Koszyk';
    }
  }

  /* Add-to-cart popup with actions (go to cart / continue shopping). */
  var popEl;
  function notify(id, qty) {
    var p = CATALOG[id]; if (!p) return;
    if (!popEl) {
      popEl = document.createElement('div');
      popEl.className = 'cart-pop';
      popEl.innerHTML =
        '<div class="cart-pop-box" role="dialog" aria-live="polite">' +
        '<button class="cart-pop-x" aria-label="Zamknij">&times;</button>' +
        '<div class="cart-pop-head"><span class="cart-pop-tick">✓</span><span>Dodano do koszyka</span></div>' +
        '<div class="cart-pop-prod"></div>' +
        '<div class="cart-pop-actions">' +
        '<a class="btn btn-gold" href="koszyk.html">Przejdź do koszyka</a>' +
        '<button class="btn btn-ghost cart-pop-cont" type="button">Kontynuuj zakupy</button>' +
        '</div></div>';
      document.body.appendChild(popEl);
      var close = function () { popEl.classList.remove('show'); };
      popEl.querySelector('.cart-pop-x').addEventListener('click', close);
      popEl.querySelector('.cart-pop-cont').addEventListener('click', close);
      popEl.addEventListener('click', function (e) { if (e.target === popEl) close(); });
    }
    var thumb = p.img ? '<img src="' + p.img + '" alt="">' : '';
    popEl.querySelector('.cart-pop-prod').innerHTML =
      thumb + '<div><strong>' + p.name + '</strong><div class="muted" style="font-size:13px">Ilość: ' + (qty || 1) + ' · w koszyku: ' + Cart.count() + '</div></div>';
    popEl.classList.add('show');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBadge);
  } else {
    renderBadge();
  }
})();

/* Back-to-top button (global) */
(function () {
  function init() {
    var b = document.createElement('button');
    b.className = 'to-top'; b.setAttribute('aria-label', 'Do góry'); b.innerHTML = '↑';
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(b);
    var onScroll = function () { b.classList.toggle('show', window.scrollY > 500); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Global lightbox for review images (balzam carousel + opinie grid) */
(function () {
  function init() {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-x" aria-label="Zamknij">&times;</button><img alt="Opinia">';
    document.body.appendChild(lb);
    var img = lb.querySelector('img');
    function close() { lb.classList.remove('show'); img.src = ''; }
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && (t.closest('.rev-track, .reviews-grid') || t.id === 'gmain')) {
        img.src = t.currentSrc || t.src; lb.classList.add('show');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Recently viewed products (localStorage).
   A page records its product by setting <body data-recent="<catalog-id>">.
   The row is rendered (above the footer) on any page marked data-recent or
   data-recent-show, excluding the current product. Uses Cart.CATALOG for data. */
(function () {
  var KEY = 'bolotov_recent_v1', MAX = 10, SHOWN = 6;
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function record(id) {
    if (!id || !window.Cart || !Cart.CATALOG[id]) return;
    var a = read().filter(function (x) { return x !== id; });
    a.unshift(id);
    save(a.slice(0, MAX));
  }
  function fmt(n) { return n + ' zł'; }
  function render(excludeId) {
    var foot = document.querySelector('footer.site-footer');
    if (!foot || !window.Cart) return;
    var ids = read().filter(function (x) { return x !== excludeId && Cart.CATALOG[x]; }).slice(0, SHOWN);
    if (!ids.length) return;
    var cards = ids.map(function (id) {
      var p = Cart.CATALOG[id];
      var price = p.orig
        ? '<span class="recent-old">' + fmt(p.orig) + '</span><strong>' + fmt(p.price) + '</strong>'
        : '<strong>' + fmt(p.price) + '</strong>';
      return '<a class="recent-card" href="' + p.url + '">'
        + '<div class="recent-img"><img src="' + p.img + '" alt="' + p.name + '" loading="lazy"></div>'
        + '<div class="recent-name">' + p.name + '</div>'
        + '<div class="recent-price">' + price + '</div></a>';
    }).join('');
    var sec = document.createElement('section');
    sec.className = 'section recent-sec';
    sec.innerHTML = '<div class="container">'
      + '<h2 class="title" style="text-align:left;font-size:24px;margin-bottom:20px">Ostatnio oglądane</h2>'
      + '<div class="recent-row">' + cards + '</div></div>';
    foot.parentNode.insertBefore(sec, foot);
  }
  function init() {
    var b = document.body, cur = b.getAttribute('data-recent');
    if (cur) record(cur);
    if (cur != null || b.hasAttribute('data-recent-show')) render(cur);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Exit-intent popup (non-intrusive). Opt-in per page via <body data-exit="guide|cart">.
   Desktop: fires when the cursor leaves through the top edge. Mobile/no-mouse: a soft
   fallback (a decisive scroll back to the top after the user has scrolled down).
   Shown at most once per ~7 days (localStorage), never in the first few seconds,
   and the cart variant downgrades to the guide when the cart is empty. */
(function () {
  function start() {
    var b = document.body, mode = b && b.getAttribute('data-exit');
    if (!mode) return;
    var KEY = 'bolotov_exit_v1', COOLDOWN = 7 * 24 * 60 * 60 * 1000;
    function seen() { try { var t = +localStorage.getItem(KEY); return t && (Date.now() - t) < COOLDOWN; } catch (e) { return false; } }
    function mark() { try { localStorage.setItem(KEY, Date.now()); } catch (e) {} }
    if (seen()) return;
    if (mode === 'cart') { try { if (!window.Cart || !Cart.items().length) mode = 'guide'; } catch (e) { mode = 'guide'; } }

    var shown = false, armed = false, el;
    setTimeout(function () { armed = true; }, 4000);   // never in the first 4s

    var WA = 'https://wa.me/421944623644?text=Dzie%C5%84%20dobry';
    function build() {
      el = document.createElement('div');
      el.className = 'exit-pop';
      if (mode === 'cart') {
        el.innerHTML = '<div class="exit-box">'
          + '<button class="exit-x" aria-label="Zamknij">&times;</button>'
          + '<h3 class="exit-h">Nie zgub swojego koszyka 🛒</h3>'
          + '<p class="exit-p">Twoje produkty czekają. Dokończ zamówienie teraz albo napisz do nas — pomożemy dobrać produkty i odpowiemy na pytania.</p>'
          + '<div class="exit-actions"><a class="btn btn-gold" href="koszyk.html">Wróć do koszyka</a>'
          + '<a class="btn btn-wa" href="' + WA + '">Napisz na WhatsApp</a></div></div>';
      } else {
        el.innerHTML = '<div class="exit-box exit-box-guide">'
          + '<button class="exit-x" aria-label="Zamknij">&times;</button>'
          + '<div class="exit-cover"><img src="assets/img/guide-cover.png" alt="Bezpłatny przewodnik po metodzie Bolotova"></div>'
          + '<div class="exit-body"><h3 class="exit-h">Zaczekaj — odbierz darmowy przewodnik</h3>'
          + '<p class="exit-p">Zostaw e-mail, a wyślemy Ci BEZPŁATNY przewodnik po systemie Bolotova — proste zasady odżywiania i stylu życia.</p>'
          + '<form class="exit-form" onsubmit="return false">'
          + '<input type="email" required placeholder="Twój e-mail *">'
          + '<label class="exit-consent"><input type="checkbox" required><span>Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z RODO.</span></label>'
          + '<button class="btn btn-gold" type="submit">Odbierz przewodnik</button></form>'
          + '<p class="exit-mini">Bez spamu. W każdej chwili możesz zrezygnować.</p></div></div>';
      }
      document.body.appendChild(el);
      el.querySelector('.exit-x').addEventListener('click', close);
      el.addEventListener('click', function (e) { if (e.target === el) close(); });
      var form = el.querySelector('.exit-form');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
        var inp = form.querySelector('input[type="email"]');
        var email = inp ? String(inp.value || '').trim() : '';
        /* POST to the backend → amoCRM (neразобранное, tag Exit-intent) + SendPulse
           guide address book. Always resolves; the thank-you shows regardless. */
        try {
          fetch('/api/lead', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, source: 'exit-intent' })
          }).catch(function () {});
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', lead_source: 'exit-intent' });
        } catch (err) {}
        el.querySelector('.exit-body').innerHTML =
          '<h3 class="exit-h">Dziękujemy! ✓</h3><p class="exit-p">Sprawdź skrzynkę — przewodnik jest w drodze.</p>';
        setTimeout(close, 2600);
      });
    }
    function show() {
      if (shown || !armed) return;
      shown = true; mark(); build();
      setTimeout(function () { el.classList.add('show'); }, 20);   // next tick -> opacity transition (robust vs throttled rAF)
    }
    function close() { if (el) el.classList.remove('show'); }

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) show();   // cursor left through the top
    });
    var lastY = window.scrollY, maxY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY; if (y > maxY) maxY = y;
      if (maxY > 600 && lastY - y > 240 && y < 200) show();   // fast snap back to top
      lastY = y;
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
