/* Centrum Bolotova — client-side cart (localStorage).
   Handles add/update/remove, Balzam 500 ml quantity tiers, header counter badge,
   and an add-to-cart toast. Stripe charging is wired separately (needs keys). */

/* ===== Ad attribution capture (UTM + click ids) — first-touch, per session =====
   Loaded on every page (cart.js is site-wide). The order form later forwards these to
   /api/order so the amoCRM lead carries the channel/campaign (GA4 reads utm from the URL
   on its own; the CRM did not until now). First-touch: keep the first non-empty value
   across the visit, so browsing to other pages before the cart never wipes the original
   params. Exposed via window.cbAttribution() for kosik to merge into the order payload. */
(function () {
  try {
    var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                'utm_referrer','gclid','fbclid','yclid'];
    var qs = new URLSearchParams(location.search);
    var store = {};
    try { store = JSON.parse(sessionStorage.getItem('cbAttribution') || '{}') || {}; } catch (_e) { store = {}; }
    var changed = false;
    KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v && !store[k]) { store[k] = v.slice(0, 255); changed = true; }
    });
    // First external referrer (ignore same-host navigations).
    if (!store.referrer && document.referrer && document.referrer.indexOf(location.host) === -1) {
      store.referrer = document.referrer.slice(0, 255); changed = true;
    }
    if (changed) { try { sessionStorage.setItem('cbAttribution', JSON.stringify(store)); } catch (_e) {} }
    window.__cbAttribution = store;
  } catch (_e) {}
})();
window.cbAttribution = function () {
  var s = window.__cbAttribution || {};
  try { s = Object.assign({}, JSON.parse(sessionStorage.getItem('cbAttribution') || '{}'), s); } catch (_e) {}
  return s;
};

(function () {
  var CATALOG = {
    'balzam-250':            { name: 'Balzám Bolotova 250 ml', price: 799, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html' },
    'balzam-500':            { name: 'Balzám Bolotova 500 ml', price: 1010, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html',
                               tiers: [{ min: 6, price: 808 }, { min: 3, price: 860 }, { min: 1, price: 1010 }] },
    'kolagen':               { name: 'Kolagen by Bolotov', price: 1450, img: 'assets/img/prod-kolagen.png', url: 'kolagen-by-bolotov.html' },
    'l-glutamine':           { name: 'L-Glutamine Gastric Restore Complex', price: 599, img: 'assets/img/prod-lglutamine.png', url: 'l-glutamine.html' },
    'hyaluronic':            { name: 'Hyaluronic Acid + Vitamin C', price: 599, img: 'assets/img/prod-hyaluronic.png', url: 'hyaluronic-acid-vitamin-c.html' },
    'biotin':                { name: 'Biotin Zinc Selenium', price: 350, img: 'assets/img/prod-biotin.png', url: 'biotin-zinc-selenium.html' },
    'kniha':                 { name: 'Tajemství zdravého života — Boris Bolotov', price: 509, img: 'assets-cz/img/kniha-1.jpg', url: 'kniha-tajemstvi-zdraveho-zivota.html',
                               tiers: [{ min: 5, price: 399 }, { min: 3, price: 429 }, { min: 2, price: 459 }, { min: 1, price: 509 }] },
    'set-beauty-base':       { name: 'Komplet Beauty Base System', price: 1749, orig: 2049, img: 'assets/img/sets/beauty-1.png', url: 'set-beauty-base-system.html' },
    'set-reflux-paleni-zahy':{ name: 'Program na reflux a pálení žáhy', price: 1449, orig: 1800, img: 'assets/img/sets/refluks-1.png', url: 'set-reflux-paleni-zahy.html' },
    'set-tezkost-nadymani':  { name: 'Program při těžkosti a nadýmání', price: 1099, orig: 1299, img: 'assets/img/sets/ciezkosc-1.png', url: 'set-tezkost-nadymani.html' },
    'set-traveni-klouby':    { name: 'Komplet Trávení & Klouby', price: 2090, orig: 2460, img: 'assets/img/sets/trawienie-1.png', url: 'set-traveni-klouby.html' },
    'set-kolagenovy-kurz':   { name: 'Komplet Intenzivní kolagenový kurz', price: 3597, orig: 4350, img: 'assets/img/sets/kuracja-1.png', url: 'set-intenzivni-kolagenovy-kurz.html' },
    'set-restart':           { name: 'Komplet Bolotov Restart Program', price: 4450, orig: 5360, img: 'assets/img/sets/restart-1.png', url: 'set-bolotov-restart.html' }
  };

  /* ===== Market: Czechia (default) or Slovakia =====================================
     The shop is Czech, but Slovak customers order here too (owner, 2026-08-14). Slovakia
     is not a currency conversion: the canon holds its own approved EUR prices, so picking
     Slovakia swaps in that price list, its carriers and its currency. Everything else —
     sets, cross-sell, promo codes — keeps working unchanged, because switching a market
     only rewrites the numbers inside CATALOG.
     Source: knowledge-base/finance/catalog.json (markets, products, sets, delivery). */
  var MARKET_KEY = 'bolotov_market_v1';
  var PRICES = {
    CZ: {
      currency: 'CZK',
      'balzam-250': { price: 799 },
      'balzam-500': { price: 1010, tiers: [{ min: 6, price: 808 }, { min: 3, price: 860 }, { min: 1, price: 1010 }] },
      'kolagen':     { price: 1450 },
      'l-glutamine': { price: 599 },
      'hyaluronic':  { price: 599 },
      'biotin':      { price: 350 },
      'kniha':       { price: 509, tiers: [{ min: 5, price: 399 }, { min: 3, price: 429 }, { min: 2, price: 459 }, { min: 1, price: 509 }] },
      'set-beauty-base':        { price: 1749, orig: 2049 },
      'set-reflux-paleni-zahy': { price: 1449, orig: 1800 },
      'set-tezkost-nadymani':   { price: 1099, orig: 1299 },
      'set-traveni-klouby':     { price: 2090, orig: 2460 },
      'set-kolagenovy-kurz':    { price: 3597, orig: 4350 },
      'set-restart':            { price: 4450, orig: 5360 }
    },
    /* Slovak prices are the canon's own EUR figures, not a conversion of the Czech ones.
       No quantity ladders here: the canon has none for SK and inventing them would be a
       guess — see shops/czech/docs/OPEN-QUESTIONS.md. */
    SK: {
      currency: 'EUR',
      'balzam-250':  { price: 29 },
      'balzam-500':  { price: 41 },
      'kolagen':     { price: 59 },
      'l-glutamine': { price: 24 },
      'hyaluronic':  { price: 24 },
      'biotin':      { price: 14 },
      'kniha':       { price: 21 },
      'set-beauty-base':        { price: 69, orig: 83 },
      'set-reflux-paleni-zahy': { price: 59, orig: 75 },
      'set-tezkost-nadymani':   { price: 44, orig: 49 },
      'set-traveni-klouby':     { price: 87, orig: 100 },
      'set-kolagenovy-kurz':    { price: 147, orig: 177 },
      'set-restart':            { price: 183, orig: 218 }
    }
  };
  /* Cash-on-delivery surcharge. The canon still says 0 for the shop; the owner asked for a
     minimum charge on 2026-08-14 and this is the figure we start from — deliberately well
     under the delivery price so cash on delivery stays attractive, set by the owner on 2026-08-14, under the 59 CZK the kolagen landing charges. Change it here and the cart, totals and payload follow. */
  var COD_FEE = { CZ: 39, SK: 1.3 };

  var DELIVERY = {
    CZ: [{ carrier: 'Zásilkovna', price: 88, pickup: true }, { carrier: 'DPD', price: 98 },
         { carrier: 'GLS', price: 99 }, { carrier: 'PPL', price: 99 }],
    SK: [{ carrier: 'Packeta', price: 4, pickup: true }, { carrier: 'GLS', price: 5 },
         { carrier: 'PPL', price: 5.4 }, { carrier: 'DPD', price: 5.8 }]
  };
  var market = 'CZ';
  try { var _m = localStorage.getItem(MARKET_KEY); if (_m === 'SK' || _m === 'CZ') market = _m; } catch (e) {}

  function applyMarket() {
    var table = PRICES[market];
    Object.keys(CATALOG).forEach(function (id) {
      var p = table[id];
      if (!p) return;
      CATALOG[id].price = p.price;
      if (p.orig) { CATALOG[id].orig = p.orig; } else { delete CATALOG[id].orig; }
      if (p.tiers) { CATALOG[id].tiers = p.tiers; } else { delete CATALOG[id].tiers; }
    });
  }
  applyMarket();

  function setMarket(m) {
    if (m !== 'CZ' && m !== 'SK') return;
    market = m;
    try { localStorage.setItem(MARKET_KEY, m); } catch (e) {}
    applyMarket();
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  /* Money formatting follows the market: "1 450 CZK" vs "41 €" (EUR keeps decimals). */
  function fmtMoney(n) {
    if (market === 'SK') {
      var v = Math.round(n * 100) / 100;
      return (v % 1 === 0 ? String(v) : v.toFixed(2).replace('.', ',')) + ' €';
    }
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' CZK';
  }

  /* Set compositions — which single products (and how many) make up each set.
     Used to cross-sell: when the cart holds products that form a set, offer the cheaper bundle.
     (Verified against each set's "Složení kompletu" and its struck-through regular price.) */
  var SETS = {
    'set-beauty-base':        { 'kolagen': 1, 'hyaluronic': 1 },
    'set-reflux-paleni-zahy': { 'balzam-500': 1, 'l-glutamine': 1 },
    'set-tezkost-nadymani':   { 'balzam-500': 1 },
    'set-traveni-klouby':     { 'balzam-500': 1, 'kolagen': 1 },
    'set-kolagenovy-kurz':    { 'kolagen': 3 },
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
    dl({ event: 'select_set', ecommerce: { currency: PRICES[market].currency, value: CATALOG[setId].price, items: [ecomItem(setId, 1)] } });
  }

  /* Promo codes — a percentage discount limited to a product scope (case-insensitive).
     Can be entered in the cart or auto-applied via a link (?promo=CODE). Only ONE code is
     active at a time, stored in localStorage. The discount applies only to the listed product
     ids; everything else stays full price. NOTE: this is the visible/cart-side discount — the
     final charge must ALSO be enforced server-side at payment (Stripe) once keys are wired. */
  /* TODO(owner): these codes are inherited from the Polish shop and are NOT confirmed for
     Czechia. The words themselves are Polish ("urodziny" = birthday, "wracamy" = we're back),
     so a Czech customer cannot be expected to type them. Confirm the Czech code set before
     launch — see docs/OPEN-QUESTIONS.md. */
  var PROMOS = {
    'balsam':   { percent: 10, scope: ['balzam-250', 'balzam-500'], label: '−10 % na Balzám' },
    'balsam15': { percent: 15, scope: ['balzam-250', 'balzam-500'], label: '−15 % na Balzám' },
    // Nurture-email codes (auto-applied via ?promo=…). scope '*' = whole order.
    'narozeniny': { percent: 15, scope: '*', label: '−15 % k narozeninám' }, // birthday (1.16)
    'vracime':    { percent: 10, scope: '*', label: '−10 % návrat' }         // win-back (1.17)
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
    if (p.scope !== '*' && p.scope.indexOf(id) < 0) return 0;   // '*' = whole order
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
      dl({ event: 'add_to_cart', ecommerce: { currency: PRICES[market].currency, value: unitPrice(id, qty) * qty, items: [ecomItem(id, qty)] } });
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
        dl({ event: 'remove_from_cart', ecommerce: { currency: PRICES[market].currency, value: unitPrice(id, cur.qty) * cur.qty, items: [ecomItem(id, cur.qty)] } });
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
    },
    /* Market (CZ default / SK) — see the PRICES block above. */
    market: function () { return market; },
    setMarket: setMarket,
    currency: function () { return PRICES[market].currency; },
    deliveryOptions: function () { return DELIVERY[market]; },
    codFee: function () { return COD_FEE[market]; },
    fmt: fmtMoney
  };
  window.Cart = Cart;

  /* Auto-apply a promo from a link, e.g. ...?promo=balsam15 — works site-wide and persists. */
  (function () {
    try {
      var m = /[?&]promo=([^&#]+)/i.exec(location.search);
      if (m) applyPromo(decodeURIComponent(m[1]));
    } catch (e) {}
  })();

  /* Header counter badge — updates the "Košík" link on every page. */
  function renderBadge() {
    var n = Cart.count();
    var links = document.querySelectorAll('.header-actions a[href="kosik.html"]');
    for (var i = 0; i < links.length; i++) {
      links[i].textContent = n > 0 ? 'Košík (' + n + ')' : 'Košík';
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
        '<button class="cart-pop-x" aria-label="Zavřít">&times;</button>' +
        '<div class="cart-pop-head"><span class="cart-pop-tick">✓</span><span>Přidáno do košíku</span></div>' +
        '<div class="cart-pop-prod"></div>' +
        '<div class="cart-pop-actions">' +
        '<a class="btn btn-gold" href="kosik.html">Přejít do košíku</a>' +
        '<button class="btn btn-ghost cart-pop-cont" type="button">Pokračovat v nákupu</button>' +
        '</div></div>';
      document.body.appendChild(popEl);
      var close = function () { popEl.classList.remove('show'); };
      popEl.querySelector('.cart-pop-x').addEventListener('click', close);
      popEl.querySelector('.cart-pop-cont').addEventListener('click', close);
      popEl.addEventListener('click', function (e) { if (e.target === popEl) close(); });
    }
    var thumb = p.img ? '<img src="' + p.img + '" alt="">' : '';
    popEl.querySelector('.cart-pop-prod').innerHTML =
      thumb + '<div><strong>' + p.name + '</strong><div class="muted" style="font-size:13px">Množství: ' + (qty || 1) + ' · v košíku: ' + Cart.count() + '</div></div>';
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
    b.className = 'to-top'; b.setAttribute('aria-label', 'Nahoru'); b.innerHTML = '↑';
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
    lb.innerHTML = '<button class="lb-x" aria-label="Zavřít">&times;</button><img alt="Hodnocení">';
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
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0CZK'; }
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
      + '<h2 class="title" style="text-align:left;font-size:24px;margin-bottom:20px">Naposledy prohlížené</h2>'
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
    // Frequency: snooze after a dismissal (14 days) vs after the guide was taken
    // (a year — effectively "don't nag a subscriber again"). GUIDE_KEY is the shared
    // "already has the guide" flag, also set by the on-page guide form (forms.js).
    var UNTIL_KEY = 'bolotov_exit_until', GUIDE_KEY = 'bolotov_guide';
    var COOLDOWN_CLOSE = 14 * 24 * 60 * 60 * 1000, COOLDOWN_CONVERT = 365 * 24 * 60 * 60 * 1000;
    function guideObtained() { try { return localStorage.getItem(GUIDE_KEY) === '1'; } catch (e) { return false; } }
    function suppressed() { try { var u = +localStorage.getItem(UNTIL_KEY); return u && Date.now() < u; } catch (e) { return false; } }
    function snooze(ms) { try { localStorage.setItem(UNTIL_KEY, Date.now() + ms); } catch (e) {} }
    function markGuide() { try { localStorage.setItem(GUIDE_KEY, '1'); } catch (e) {} }
    if (mode === 'cart') { try { if (!window.Cart || !Cart.items().length) mode = 'guide'; } catch (e) { mode = 'guide'; } }
    if (mode === 'guide' && guideObtained()) return; // already downloaded the guide → never nag
    if (suppressed()) return;                        // within the cooldown window

    var shown = false, armed = false, el;
    setTimeout(function () { armed = true; }, 4000);   // never in the first 4s

    var WA = 'https://wa.me/421944623644?text=Dzie%C5%84%20dobry';
    function build() {
      el = document.createElement('div');
      el.className = 'exit-pop';
      if (mode === 'cart') {
        el.innerHTML = '<div class="exit-box">'
          + '<button class="exit-x" aria-label="Zavřít">&times;</button>'
          + '<h3 class="exit-h">Nezapomeňte na svůj košík 🛒</h3>'
          + '<p class="exit-p">Vaše produkty čekají. Dokončete objednávku, nebo nám napište — pomůžeme vybrat produkty a odpovíme na dotazy.</p>'
          + '<div class="exit-actions"><a class="btn btn-gold" href="kosik.html">Zpět do košíku</a>'
          + '<a class="btn btn-wa" href="' + WA + '">Napište na WhatsApp</a></div></div>';
      } else {
        el.innerHTML = '<div class="exit-box exit-box-guide">'
          + '<button class="exit-x" aria-label="Zavřít">&times;</button>'
          + '<div class="exit-cover"><img src="assets/img/guide-cover.png" alt="Bezplatný průvodce metodou Bolotova"></div>'
          + '<div class="exit-body"><h3 class="exit-h">Počkejte — získejte bezplatného průvodce</h3>'
          + '<p class="exit-p">Nechte nám e-mail a pošleme vám BEZPLATNÉHO průvodce systémem Bolotova — jednoduché principy výživy a životního stylu.</p>'
          + '<form class="exit-form" novalidate onsubmit="return false">'
          + '<input type="email" required placeholder="Váš e-mail *">'
          + '<label class="exit-consent"><input type="checkbox" required><span>Souhlasím se zpracováním osobních údajů podle GDPR.</span></label>'
          + '<button class="btn btn-gold" type="submit">Získat průvodce</button></form>'
          + '<p class="exit-mini">Žádný spam. Kdykoli se můžete odhlásit.</p></div></div>';
      }
      document.body.appendChild(el);
      el.querySelector('.exit-x').addEventListener('click', close);
      el.addEventListener('click', function (e) { if (e.target === el) close(); });
      var form = el.querySelector('.exit-form');
      if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = form.querySelector('input[type="email"]');
        var cbx = form.querySelector('input[type="checkbox"]');
        var email = inp ? String(inp.value || '').trim() : '';
        /* Custom validation (Polish messages, no locale-dependent native bubbles). */
        var oldErr = form.querySelector('.cb-field-err'); if (oldErr) oldErr.remove();
        if (inp) inp.classList.remove('cb-invalid');
        var badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (badEmail || (cbx && !cbx.checked)) {
          var target = badEmail ? inp : cbx;
          var msg = badEmail
            ? (email ? 'Neplatná e-mailová adresa (např. jan@example.com).' : 'Zadejte e-mailovou adresu.')
            : 'Zaškrtněte souhlas, abyste mohli pokračovat.';
          var h = document.createElement('div'); h.className = 'cb-field-err'; h.textContent = msg;
          if (badEmail && inp) { inp.classList.add('cb-invalid'); inp.parentNode.insertBefore(h, inp.nextSibling); try { inp.focus(); } catch (er) {} }
          else if (cbx) { var lab = cbx.closest('label') || cbx; lab.parentNode.insertBefore(h, lab.nextSibling); }
          return;
        }
        markGuide(); snooze(COOLDOWN_CONVERT); // converted → mark guide taken, don't nag again
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
          '<h3 class="exit-h">Děkujeme! ✓</h3><p class="exit-p">Zkontrolujte schránku — průvodce je na cestě.</p>';
        setTimeout(close, 2600);
      });
    }
    function show() {
      if (shown || !armed) return;
      shown = true; snooze(COOLDOWN_CLOSE); build();
      setTimeout(function () { el.classList.add('show'); }, 20);   // next tick -> opacity transition (robust vs throttled rAF)
    }
    function close() { if (el) el.classList.remove('show'); }

    // Desktop only (owner, 2026-07-21): trigger on the cursor leaving through the top
    // edge. No mobile trigger — the scroll-back-to-top heuristic misfired and annoyed;
    // touch devices have no such exit signal, so the popup simply never shows there.
    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget && e.clientY <= 0) show();   // cursor left through the top
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
