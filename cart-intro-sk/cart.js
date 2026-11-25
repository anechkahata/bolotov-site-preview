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
    // No `yclid` (Yandex click id) since 2026-11-16: nothing read it, and the server no longer takes it.
    var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                'utm_referrer','gclid','fbclid'];
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
    // Kept in sessionStorage only with consent («Přijmout vše» / «Prijať všetko»): the click ids and
    // campaign tags are tracking data, and the cookie policy promises exactly this (2026-10-26).
    // Without consent they live in memory for the page they arrived on and travel no further.
    var consented = function () { try { return localStorage.getItem('cb-consent') === 'all'; } catch (_e) { return false; } };
    var persist = function () { try { sessionStorage.setItem('cbAttribution', JSON.stringify(store)); } catch (_e) {} };
    if (changed && consented()) persist();
    document.addEventListener('cb:consent', function () { if (consented() && Object.keys(store).length) persist(); });
    window.__cbAttribution = store;
  } catch (_e) {}
})();
/* ===== Expiry of the checkout copies on every page (GDPR forms audit 2026-11-16) =====
   kosik.html keeps what the buyer typed (`cb_checkout_v1`) and an unpaid card order (`cb_pending_order_v1`) for
   7 days — the cookie policy says «nejdéle 7 dní» — but it only checked the age when the cart page was opened
   again. A buyer who never came back to the cart kept name, phone, e-mail and address in the browser for ever.
   Same rule here, on every page: a copy without a timestamp or older than 7 days is removed. */
(function () {
  try {
    var MAX = 7 * 86400000;
    ['cb_checkout_v1', 'cb_pending_order_v1'].forEach(function (k) {
      var raw = localStorage.getItem(k);
      if (raw === null) return;
      var v = null;
      try { v = JSON.parse(raw); } catch (_e) { v = null; }
      if (!v || typeof v.at !== 'number' || Date.now() - v.at > MAX) localStorage.removeItem(k);
    });
  } catch (_e) {}
})();
window.cbAttribution = function () {
  var s = window.__cbAttribution || {};
  try { s = Object.assign({}, JSON.parse(sessionStorage.getItem('cbAttribution') || '{}'), s); } catch (_e) {}
  return s;
};

(function () {
  /* Language binding. Every storefront folder (cz/, sk/) ships a `lang.js` loaded BEFORE
     this file; it carries the product names, the page filenames, the promo labels, the UI
     strings and the domain's default delivery country. Nothing language-specific lives in
     this file, so a fix to the cart is a fix for every market at once. */
  var CB        = window.CB || {};
  var L         = CB.t || {};
  var NAMES     = CB.names || {};
  var URLS      = CB.urls || {};
  var CART_PAGE = CB.cartPage || 'kosik.html';

  /* Product images are the same picture in every language — only the caption differs.
     Prices, `orig` and quantity tiers are NOT written here: applyMarket() fills them from
     PRICES below, so the market's own price list stays the only source. */
  /* Set pictures carry the storefront's own language and prices, so the path prefix comes from
     lang.js (cz/ or sk/); the shared file only knows the picture's name. */
  var SET_IMG = (window.CB && CB.setImg) || 'media/img/sets/cz-';
  var CATALOG = {
    'balzam-250':            { img: 'assets/img/cat/balzam.webp' },
    'balzam-500':            { img: 'assets/img/cat/balzam.webp' },
    /* Marine Collagen Shots (20 / 30) and the night cream replace Kolagen by Bolotov (owner 2026-11-08). */
    'shots-20':              { img: 'assets/img/cat/shots-20.webp' },
    'shots-30':              { img: 'assets/img/cat/shots-30.webp' },
    'krem-noc':              { img: 'assets/img/cat/krem-noc.webp' },
    'l-glutamine':           { img: 'assets/img/cat/lglutamine.webp' },
    'hyaluronic':            { img: 'assets/img/cat/hyaluronic.webp' },
    'biotin':                { img: 'assets/img/cat/biotin.webp' },
    'kniha':                 { img: 'media/img/kniha-cat.webp' },
    /* The collagen sets share one picture across CZ / SK / PL (no words on it), kept in the Polish shop's image folder «sets». */
    'set-beauty-base':       { img: 'assets/img/sets/beauty-base-cat.webp' },
    'set-den-noc':           { img: 'assets/img/sets/den-noc-cat.webp' },
    'set-complete-skin':     { img: 'assets/img/sets/complete-skin-cat.webp' },
    'set-total-beauty':      { img: 'assets/img/sets/total-beauty-cat.webp' },
    'set-vlasy-nehty':       { img: 'assets/img/sets/vlasy-nehty-cat.webp' },
    'set-anti-age':          { img: 'assets/img/sets/anti-age-cat.webp' },
    'set-reflux-paleni-zahy':{ img: SET_IMG + 'refluks-cat.webp' },
    'set-tezkost-nadymani':  { img: SET_IMG + 'ciezkosc-cat.webp' },
    'set-traveni-klouby':    { img: 'assets/img/sets/traveni-klouby-cat.webp' },
    'set-kolagenovy-kurz':   { img: 'assets/img/sets/intenzivni-cat.webp' },
    'set-restart':           { img: 'assets/img/sets/restart-shots-cat.webp' },
    'set-reflux-start':      { img: SET_IMG + 'start-cat.webp' },
    /* Zdravé Vánoce 2026 — the pictures differ per storefront for two of them, so lang.js may
       override any of these (CB.images). */
    'vanoce-rychla':         { img: 'media/img/vanoce/rychla.jpg' },
    'vanoce-lehke':          { img: 'media/img/vanoce/lehke.jpg' },
    'vanoce-pro-dva':        { img: 'media/img/vanoce/pro-dva.jpg' },
    'vanoce-rodina-kniha':   { img: 'media/img/vanoce/rodina-kniha.jpg' },
    'vanoce-rodina':         { img: 'media/img/vanoce/rodina.jpg' },
    'vanoce-velka-zasoba':   { img: 'media/img/vanoce/velka-zasoba.jpg' },
    'vanoce-zimni-zasoba':   { img: 'media/img/vanoce/zimni-zasoba.jpg' },
    /* Black Friday 2026 «3 produkty za cenu 1» (2 × 250 ml + L-Glutamine gift, owner 2026-11-25) — the page's picture (tools/bf_page.py). */
    'set-black-friday':      { img: 'assets/img/bf/3produkty-darky-600.webp' }
  };
  Object.keys(CB.images || {}).forEach(function (id) { if (CATALOG[id]) CATALOG[id].img = CB.images[id]; });
  Object.keys(CATALOG).forEach(function (id) {
    CATALOG[id].name = NAMES[id] || id;
    CATALOG[id].url  = URLS[id] || '';
  });

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
      'shots-20':    { price: 1450, tiers: [{ min: 3, price: 1199 }, { min: 1, price: 1450 }] },
      'shots-30':    { price: 1750, tiers: [{ min: 2, price: 1575 }, { min: 1, price: 1750 }] },
      'krem-noc':    { price: 749 },
      'l-glutamine': { price: 599 },
      'hyaluronic':  { price: 599 },
      'biotin':      { price: 350 },
      'kniha':       { price: 509, tiers: [{ min: 5, price: 399 }, { min: 3, price: 429 }, { min: 2, price: 459 }, { min: 1, price: 509 }] },
      'set-beauty-base':        { price: 1749, orig: 2049 },
      'set-den-noc':            { price: 2190, orig: 2499 },
      'set-complete-skin':      { price: 2690, orig: 3098 },
      'set-total-beauty':       { price: 2990, orig: 3448 },
      'set-vlasy-nehty':        { price: 1890, orig: 2100 },
      'set-anti-age':           { price: 5490, orig: 6457 },
      'set-reflux-paleni-zahy': { price: 1449, orig: 1800 },
      'set-tezkost-nadymani':   { price: 1099, orig: 1299 },
      'set-traveni-klouby':     { price: 2090, orig: 2460 },
      'set-kolagenovy-kurz':    { price: 2890, orig: 3500 },
      'set-restart':            { price: 4450, orig: 5360 },
      'set-reflux-start':        { price: 999, orig: 1590 },
      'vanoce-rychla':           { price: 990, orig: 1687 },
      'vanoce-lehke':            { price: 1449, orig: 2598 },
      'vanoce-pro-dva':          { price: 1690, orig: 2020 },
      'vanoce-rodina-kniha':     { price: 3190, orig: 4549 },
      'vanoce-rodina':           { price: 3030, orig: 4040 },
      'vanoce-velka-zasoba':     { price: 3990, orig: 6358 },
      'vanoce-zimni-zasoba':     { price: 2490, orig: 3829 },
      'set-black-friday':        { price: 799, orig: 2197 }
    },
    /* Slovak prices are the canon's own EUR figures, not a conversion of the Czech ones.
       The quantity ladders were taken from the live Slovak shop centerbolotova.eu/sk/ on
       the owner's instruction (2026-08-15), read out of its own price data rather than
       recalculated from the Czech percentages — same source and same method as the Czech
       ladders above. Verified there: balzam 500 ml 41/35/33, kniha
       21/19/18/17. Balzam 250 ml, L-Glutamine, Hyaluronic and Biotin have no ladder. */
    SK: {
      currency: 'EUR',
      'balzam-250':  { price: 29 },
      'balzam-500':  { price: 41, tiers: [{ min: 6, price: 33 }, { min: 3, price: 35 }, { min: 1, price: 41 }] },
      'shots-20':    { price: 59, tiers: [{ min: 3, price: 49 }, { min: 1, price: 59 }] },
      'shots-30':    { price: 69, tiers: [{ min: 2, price: 62 }, { min: 1, price: 69 }] },
      'krem-noc':    { price: 29 },
      'l-glutamine': { price: 24 },
      'hyaluronic':  { price: 24 },
      'biotin':      { price: 14 },
      'kniha':       { price: 21, tiers: [{ min: 5, price: 17 }, { min: 3, price: 18 }, { min: 2, price: 19 }, { min: 1, price: 21 }] },
      'set-beauty-base':        { price: 69, orig: 83 },
      'set-den-noc':            { price: 86, orig: 98 },
      'set-complete-skin':      { price: 105, orig: 122 },
      'set-total-beauty':       { price: 118, orig: 136 },
      'set-vlasy-nehty':        { price: 75, orig: 83 },
      'set-anti-age':           { price: 219, orig: 256 },
      'set-reflux-paleni-zahy': { price: 59, orig: 75 },
      'set-tezkost-nadymani':   { price: 44, orig: 49 },
      'set-traveni-klouby':     { price: 87, orig: 100 },
      'set-kolagenovy-kurz':    { price: 116, orig: 138 },
      'set-restart':            { price: 183, orig: 218 },
      'set-reflux-start':        { price: 40, orig: 63 },
      'vanoce-rychla':           { price: 39, orig: 61 },
      'vanoce-lehke':            { price: 59, orig: 104 },
      'vanoce-pro-dva':          { price: 68, orig: 82 },
      'vanoce-rodina-kniha':     { price: 129, orig: 185 },
      'vanoce-rodina':           { price: 123, orig: 164 },
      'vanoce-velka-zasoba':     { price: 159, orig: 255 },
      'vanoce-zimni-zasoba':     { price: 99, orig: 152 },
      'set-black-friday':        { price: 29, orig: 82 }
    }
  };
  /* Cash-on-delivery surcharge — a second copy of the canon's `delivery.<market>.cod_surcharge_shop`,
     asserted against it by backend/tools/verify-catalog.php. 0 since 2026-10-26 (owner: no fee on the
     main shop; the kolagen landing keeps its 39 Kč / 2 €). A non-zero value brings the cart row,
     the «+ fee» label and the totals back by itself. */
  var COD_FEE = { CZ: 0, SK: 0 };

  var DELIVERY = {
    CZ: [{ carrier: 'Zásilkovna', price: 88, pickup: true }, { carrier: 'DPD', price: 98 },
         { carrier: 'GLS', price: 99 }, { carrier: 'PPL', price: 99 }],
    SK: [{ carrier: 'Packeta', price: 4, pickup: true }, { carrier: 'GLS', price: 5 },
         { carrier: 'PPL', price: 6 }, { carrier: 'DPD', price: 6 }]
  };
  /* The carrier pre-selected in the cart, per market: GLS in Slovakia (owner 2026-10-26, as on the Bitrix
     shop since 19.10), the first one listed — Zásilkovna — in Czechia. */
  var DEFAULT_CARRIER = { SK: 'GLS' };

  /* The domain sets the DEFAULT delivery country (centrumbolotova.cz → CZ,
     centrumbolotova.sk → SK); the visitor's own choice in the cart wins over it and
     survives page loads. See shops/README.md → «Domains and markets». */
  var market = (CB.market === 'SK' || CB.market === 'CZ') ? CB.market : 'CZ';
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
    if (typeof promosFor === 'function') { PROMOS = promosFor(m); if (window.Cart) Cart.PROMOS = PROMOS; }
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
    'set-beauty-base':        { 'shots-20': 1, 'hyaluronic': 1 },
    'set-den-noc':            { 'shots-30': 1, 'krem-noc': 1 },
    'set-complete-skin':      { 'shots-30': 1, 'krem-noc': 1, 'hyaluronic': 1 },
    'set-total-beauty':       { 'shots-30': 1, 'krem-noc': 1, 'hyaluronic': 1, 'biotin': 1 },
    'set-vlasy-nehty':        { 'shots-30': 1, 'biotin': 1 },
    'set-anti-age':           { 'balzam-500': 1, 'shots-30': 2, 'krem-noc': 1, 'hyaluronic': 2 },
    'set-reflux-paleni-zahy': { 'balzam-500': 1, 'l-glutamine': 1 },
    'set-tezkost-nadymani':   { 'balzam-500': 1 },
    'set-traveni-klouby':     { 'balzam-500': 1, 'shots-20': 1 },
    'set-kolagenovy-kurz':    { 'shots-30': 2 },
    'set-restart':            { 'balzam-500': 1, 'shots-20': 3 },
    'set-reflux-start':        { 'balzam-250': 1, 'l-glutamine': 1 },
    'vanoce-rychla':           { 'balzam-250': 1, 'l-glutamine': 1 },
    'vanoce-lehke':            { 'balzam-500': 1, 'l-glutamine': 1 },
    'vanoce-pro-dva':          { 'balzam-500': 2 },
    'vanoce-rodina-kniha':     { 'balzam-500': 4 },
    'vanoce-rodina':           { 'balzam-500': 4 },
    'vanoce-velka-zasoba':     { 'balzam-500': 5 },
    'vanoce-zimni-zasoba':     { 'balzam-500': 3 },
    'set-black-friday':        { 'balzam-250': 2 }   // + L-Glutamine as a gift (0) — gifts are not listed here, as in the Christmas sets
  };

  /* Seasonal sets: on sale only inside their window (midnight, local time = Prague/Bratislava),
     the same dates the server enforces (backend/src/Catalog.php → isOnSale; generated from
     shops/legacy-bitrix/pages/vanoce/sets.json). `listed` is when the Christmas page shows the card.
     They take no discount code and the cart never suggests them as a cheaper bundle. */
  var WINDOWS = {
    'vanoce-rychla':       { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-01' },
    'vanoce-lehke':        { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-01' },
    'vanoce-pro-dva':      { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-01' },
    'vanoce-zimni-zasoba': { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-01' },
    'vanoce-rodina-kniha': { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-16' },
    'vanoce-rodina':       { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-16' },
    'vanoce-velka-zasoba': { from: '2026-11-01', until: '2026-12-15', listed: '2026-11-16' },
    /* Black Friday 2026 (canon set 32): 27.–30. 11. inclusive in the canon, so `until` is 1.12 here (exclusive). */
    'set-black-friday':    { from: '2026-11-27', until: '2026-12-01', listed: '2026-11-27' }
  };
  /* At most this many of a set in one order (canon `max_per_order`, backend Catalog::maxQty — the server refuses more):
     Black Friday «3 produkty za cenu 1» is one per order (owner 2026-11-24). add() and setQty() never go above it. */
  var MAX_QTY = { 'set-black-friday': 1 };
  function maxQty(id) { return MAX_QTY[id] || null; }
  function capQty(id, qty) { var m = maxQty(id); return m && qty > m ? m : qty; }
  /* «Today» on the shop's clock — Europe/Prague (Bratislava keeps the same time), the zone the server compares
     every date in (backend/src/Config.php). The Christmas windows below, the code windows (validFrom / validUntil)
     and the date-bound blocks all read it, so the cart and the server change day at the same midnight. It used to be
     the browser's own clock here and UTC for the codes: from 00:00 to 01:00 (02:00 in summer) Prague the cart still
     took a code the server had already closed — VERNY40 on 15.12 — or refused one it had opened (audit 2026-11-10,
     item 8). Without Intl time zones (very old browsers) the Central European rule is applied by hand: UTC+1, UTC+2
     from the last Sunday of March to the last Sunday of October, 01:00 UTC both. */
  function pragueDay(now) {
    var d = now || new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    try {
      var s = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) {}
    var y = d.getUTCFullYear();
    var lastSunday = function (month) {          // 01:00 UTC on the last Sunday of the month (0-based)
      var t = new Date(Date.UTC(y, month + 1, 0, 1));
      return t.getTime() - t.getUTCDay() * 864e5;
    };
    var ms = d.getTime(), summer = ms >= lastSunday(2) && ms < lastSunday(9);
    var local = new Date(ms + (summer ? 2 : 1) * 36e5);
    return local.getUTCFullYear() + '-' + p(local.getUTCMonth() + 1) + '-' + p(local.getUTCDate());
  }
  function today() {
    // ?cb_today=2026-11-20 lets a preview show the page as it will look on that day (display only:
    // the server checks its own clock).
    var m = /[?&]cb_today=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    return m ? m[1] : pragueDay();
  }
  function onSale(id) { var w = WINDOWS[id]; if (!w) return true; var t = today(); return t >= w.from && t < w.until; }
  function listed(id) { var w = WINDOWS[id]; if (!w) return true; var t = today(); return t >= w.listed && t < w.until; }
  function takesCodes(id) { return !WINDOWS[id]; }

  var KEY = 'bolotov_cart_v1';

  /* GTM dataLayer push (GA4 e-commerce). Safe pre-consent — tags are gated by Consent Mode. */
  function dl(o) { try { (window.dataLayer = window.dataLayer || []).push(o); } catch (e) {} }
  function ecomItem(id, qty) {
    var p = CATALOG[id]; if (!p) return null;
    return { item_id: id, item_name: p.name, price: unitPrice(id, qty || 1), quantity: qty || 1 };
  }

  /* An id this shop no longer sells is read as its successor — in a saved cart (read) and in a cart link (add=):
     `kolagen` (Kolagen by Bolotov, gone since 2026-11-09) → the 20-shot box of Marine Collagen Shots, the product its
     page 301s to (owner 2026-11-08). A cart saved before the switch kept `kolagen` and lost it silently on the next
     visit (audit 2026-11-10, orchestrator's item c); now it shows the shots, and the quantities add up when the shots
     are in the cart too. */
  var RETIRED = { 'kolagen': 'shots-20' };
  function successors(items) {
    var out = [], at = {};
    items.forEach(function (i) {
      if (!i || !i.id) return;
      var id = RETIRED[i.id] && !CATALOG[i.id] ? RETIRED[i.id] : i.id;
      if (at[id] !== undefined) { out[at[id]].qty += (i.qty || 1); return; }
      at[id] = out.length;
      out.push(id === i.id ? i : { id: id, qty: i.qty || 1 });
    });
    return out;
  }
  function read() {
    var items;
    try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }
    // A Christmas set left in a cart after its window (or an id this build no longer sells) drops out
    // instead of failing at checkout; the server refuses it anyway. A retired id becomes its successor first.
    return successors(Array.isArray(items) ? items : []).filter(function (i) { return CATALOG[i.id] && onSale(i.id); });
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
  /* Sets whose struck price and saving are never SHOWN (2026-11-10, audit item 6; shops/czsk/docs/DECISIONS.md §45): the «Těžkost a nadýmání»
     programme is the balm 500 ml + the printed 7-day guide, which is not sold alone, so the set costs MORE than the
     balm bought alone — a saving «against the components» would mislead. Its regular total stays in the data (canon,
     server, the code maths above); only the display drops it: no «−N %» pill, no struck price, no saving line. */
  // Empty since 2026-11-10 evening: the owner brought set 13's struck price and saving back («да конечно верни» —
  // the printed guide's value counts, as on set 12). The mechanism stays for a set that ever needs it again.
  var NO_SAVING_SHOWN = {};
  function showsSaving(id) { return !NO_SAVING_SHOWN[id]; }
  // Money saved on a line vs the regular price (what the cart shows — none for the sets above).
  function lineSavings(id, qty) {
    if (!showsSaving(id)) return 0;
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
      if (WINDOWS[setId]) return;                 // seasonal sets live on their own page only
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
    // A set with a gift inside (the Christmas sets) spells out its full contents in lang.js.
    if (CB.contents && CB.contents[id]) return CB.contents[id];
    var comp = SETS[id];
    if (!comp) return null;
    var parts = Object.keys(comp).map(function (pid) {
      var p = CATALOG[pid]; if (!p) return '';
      return comp[pid] > 1 ? p.name + ' ×' + comp[pid] : p.name;
    }).filter(Boolean);
    if (CB.guides && CB.guides[id]) parts.push(CB.guides[id]);   // the free printed guide, as on Bitrix
    return parts.join(' + ');
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

  /* ===== Discount codes ==========================================================================
     The codes themselves are NOT written here or in lang.js by hand: they come from the canon
     register knowledge-base/finance/promos.json, generated into each storefront's lang.js by
     `backend/tools/gen-promos.php`. One register, three shops, same meaning everywhere.

     What the cart shows must match what the server charges, so the rules below are exactly the
     ones `backend/src/Pricing.php` applies again on the order:

       · one code at a time;
       · a code NEVER stacks with a quantity ladder — the customer pays the lower of the two, which
         is why the balzám code changes nothing from 3 pcs, where the ladder already gives its price;
       · `maxQty` — the code only reaches lines up to that quantity (the balzám code is for 1–2 pcs);
       · `validFrom` / `validUntil` — a date window, when the canon sets one.

     The server has the last word: the cart posts the code, the endpoint re-checks it and prices
     from the canon. Anything shown here is a preview, never the charge. */
  /* The codes of the country the order is for: a Czech page switched to Slovakia prices in euros
     with the Slovak words, exactly as the server does (Promos::find by the order's market). */
  function promosFor(m) {
    if (!CB.promoMarket || m === CB.promoMarket) return CB.promos || {};
    return (CB.promosAlt || {})[m] || {};
  }
  var PROMOS = promosFor(market);
  var PROMO_KEY = 'bolotov_promo_v1';
  function normPromo(code) { return (code || '').trim().toLowerCase(); }
  function promoLive(p) {
    if (!p) return false;
    var day = today();                                    // Prague, as backend/src/Promos.php → find
    if (p.validFrom && day < p.validFrom) return false;
    if (p.validUntil && day > p.validUntil) return false;
    return true;
  }
  function activePromo() {
    try {
      var c = localStorage.getItem(PROMO_KEY);
      return c && PROMOS[c] && promoLive(PROMOS[c]) ? c : null;
    } catch (e) { return null; }
  }
  function promoDef(code) {
    var p = PROMOS[normPromo(code)];
    return promoLive(p) ? p : null;
  }
  /* A real code whose window has not opened yet (DEKUJEME / DAKUJEME from the printed Christmas card:
     from 2026-12-25 — owner 2026-11-01). The shop then says when it starts instead of «invalid code». */
  var PENDING_KEY = 'bolotov_promo_pending';
  function promoPending(code) {
    var p = PROMOS[normPromo(code)];
    if (!p || !p.validFrom) return null;
    return today() < p.validFrom ? p : null;
  }
  function fmtDay(iso) {                                  // 2026-12-25 -> «25. 12. 2026» (CZ and SK alike)
    var d = (iso || '').split('-');
    return d.length === 3 ? (+d[2]) + '. ' + (+d[1]) + '. ' + d[0] : iso;
  }
  function promoStartsText(code) {
    var p = promoPending(code); if (!p) return '';
    return (L.promoStarts || '').replace('{code}', p.code || code.toUpperCase())
      .replace('{from}', fmtDay(p.validFrom)).replace('{until}', fmtDay(p.validUntil))
      .replace('{pct}', p.percent != null ? p.percent : '');
  }
  function applyPromo(code) {
    code = normPromo(code);
    if (!promoDef(code)) return false;
    try { localStorage.setItem(PROMO_KEY, code); } catch (e) {}
    dl({ event: 'select_promotion', promotion_id: (PROMOS[code].code || code) });
    document.dispatchEvent(new CustomEvent('cart:change'));
    return true;
  }
  function clearPromo() {
    try { localStorage.removeItem(PROMO_KEY); } catch (e) {}
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  /* The unit price a line is actually charged, code included: the lower of the ladder price and
     the code's price, and only where the code reaches. This is the one function that decides what
     a promo does to money on the page — everything else adds it up. */
  function promoUnit(id, qty) {
    var ladder = unitPrice(id, qty);
    var c = activePromo(); if (!c) return ladder;
    var p = PROMOS[c];
    if (p.type !== 'unit_price' || !takesCodes(id)) return ladder;
    if ((p.ids || []).indexOf(id) < 0) return ladder;
    if (p.maxQty && qty > p.maxQty) return ladder;      // ladder territory
    return Math.min(ladder, p.price);
  }
  /* A bundle_prices code (SEKRET, KOLAGENHYAL, REFLUXKNIHA…) reaches only when every item it names
     is in the cart; then ONE unit of each is charged at the code's price — the gift at 0 — never
     deeper than the line already is. Same rule as backend/src/Pricing.php (ported from the Polish
     shop, 2026-10-26). */
  function bundleComplete(p) {
    var q = qtyMap();
    return (p.ids || []).length > 0 && (p.ids || []).every(function (id) { return (q[id] || 0) > 0; });
  }
  // The items of the active bundle code that are not in the cart yet — for the «add them» button.
  function bundleMissing() {
    var c = activePromo(); if (!c || PROMOS[c].type !== 'bundle_prices') return [];
    var q = qtyMap();
    return (PROMOS[c].ids || []).filter(function (id) { return !(q[id] > 0) && CATALOG[id] && onSale(id); });
  }
  function addBundle() {
    var items = read();
    bundleMissing().forEach(function (id) { items.push({ id: id, qty: 1 }); });
    write(items);
  }
  // Money the code takes off one line (0 when it does not reach it, or the ladder is already lower).
  function promoLineDiscount(id, qty) {
    var c = activePromo();
    if (c && PROMOS[c].type === 'bundle_prices') {
      var bp = PROMOS[c];
      if (!bundleComplete(bp) || !(id in (bp.prices || {})) || !takesCodes(id)) return 0;
      var off = unitPrice(id, qty) - bp.prices[id];
      return off > 0 ? Math.round(off * 100) / 100 : 0;
    }
    var d = (unitPrice(id, qty) - promoUnit(id, qty)) * qty;
    return d > 0 ? Math.round(d * 100) / 100 : 0;
  }
  // Money the code takes off the whole order — per-line for a unit_price code, a share of the
  // goods for a percent code (rounded UP to the market's step, in the customer's favour).
  function promoSavings() {
    var c = activePromo(); if (!c) return 0;
    var p = PROMOS[c];
    if (p.type === 'percent') {
      var step = (CB.promoRounding && CB.promoRounding[market]) || (market === 'SK' ? 0.1 : 1);
      var off  = function (amount) { return Math.ceil((amount * p.percent / 100) / step) * step; };
      var total = 0;
      read().forEach(function (i) {
        if ((p.scope || 'order') !== 'order' && (p.ids || []).indexOf(i.id) < 0) return;
        if (!takesCodes(i.id)) return;            // no code reaches a Christmas set
        var line = unitPrice(i.id, i.qty) * i.qty;
        if (p.stacks) { total += off(line); return; }
        /* A personal code does not add itself to the shop's own discount: the line is worth the
           better of the two — the ladder or bundle price it already has, or the code's percentage
           off the regular price. Same rule as backend/src/Pricing.php, or the page would promise
           a discount the server refuses. */
        var reg = regularUnit(i.id) * i.qty;
        var withCode = reg - off(reg);
        if (withCode < line) { total += line - withCode; }
      });
      var goods = read().reduce(function (s, i) { return s + unitPrice(i.id, i.qty) * i.qty; }, 0);
      return Math.round(Math.min(total, goods) * 100) / 100;
    }
    return read().reduce(function (s, i) { return s + promoLineDiscount(i.id, i.qty); }, 0);
  }
  /* Why a code the customer holds may still take nothing off — the cart says this out loud
     instead of showing «− 0», which reads as a broken code. */
  function promoNote() {
    var c = activePromo(); if (!c) return '';
    var p = PROMOS[c];
    if (promoSavings() > 0) return '';
    if (p.type === 'bundle_prices') return 'bundle';                      // not every item in the cart yet
    if (p.type === 'percent') {
      /* A scoped percentage code (one that names its SKUs) takes nothing off when the products it
         covers are simply not in the cart — that is 'scope', not a deeper price. */
      if ((p.scope || 'order') !== 'order' &&
          !read().some(function (i) { return (p.ids || []).indexOf(i.id) >= 0; })) return 'scope';
      // Otherwise a live percentage code that takes nothing off means every line it reaches
      // already has a deeper discount of its own — the ladder or a komplet.
      return read().length ? 'ladder' : 'scope';
    }
    var items = read();
    var inCart = items.filter(function (i) { return (p.ids || []).indexOf(i.id) >= 0; });
    if (!inCart.length) return 'scope';                                   // product not in the cart
    if (p.maxQty && inCart.every(function (i) { return i.qty > p.maxQty; })) return 'maxqty';
    return 'ladder';                                                      // ladder already cheaper
  }

  /* Product and set pages: the price the active code gives, and a line saying the code is on. Ported
     from the Polish shop (2026-10-20: a chat «buy» opened the card at the full price while the chat
     promised a discount — 39 visits, 1 add-to-cart); here since the 2026-10-26 audit, because the old
     Bitrix links (…/bolotov-balsam/?coupon=VRACIME) now land on these cards with their code.
     Same money rules as the cart (promoUnit / promoSavings above): note '' the code lowers this price ·
     'bundle' a gift code that needs its other items · 'ladder' this price is already lower · 'scope' the
     code skips this product. Words come from lang.js → CB.t.cardPromo. */
  function cardPromo(id) {
    var c = activePromo(); if (!c || !CATALOG[id]) return null;
    var p = PROMOS[c], ids = p.ids || [];
    var base = unitPrice(id, 1), price = base, note = '', bundle = 0;
    if (!takesCodes(id)) note = 'scope';
    else if (p.type === 'unit_price') {
      price = promoUnit(id, 1);
      if (price >= base) note = ids.indexOf(id) < 0 ? 'scope' : 'ladder';
    } else if (p.type === 'percent') {
      if ((p.scope || 'order') !== 'order' && ids.indexOf(id) < 0) note = 'scope';
      else {
        var step = (CB.promoRounding && CB.promoRounding[market]) || (market === 'SK' ? 0.1 : 1);
        var reg = p.stacks ? base : regularUnit(id);
        var withCode = Math.round((reg - Math.ceil((reg * p.percent / 100) / step) * step) * 100) / 100;
        if (withCode < base) price = withCode; else note = 'ladder';
      }
    } else if (p.type === 'bundle_prices') {
      note = ids.indexOf(id) < 0 ? 'scope' : 'bundle';
      ids.forEach(function (b) { bundle += (p.prices || {})[b] || 0; });
    } else note = 'scope';
    return { code: String(p.code || c).toUpperCase(), label: p.label || '', ids: ids, base: base, price: price, note: note, bundle: bundle };
  }
  function paintCards() {
    var id = document.body && document.body.getAttribute('data-recent');
    var hero = document.querySelector('.pd-hero');
    if (!id || !hero || !CATALOG[id]) return;
    var act = hero.querySelector('[data-id].btn-primary');           // the balsam's chosen volume
    if (act && CATALOG[act.getAttribute('data-id')]) id = act.getAttribute('data-id');
    var T = (CB.t && CB.t.cardPromo) || {}, cp = cardPromo(id);
    var priceEl = hero.querySelector('#price') || hero.querySelector('.price-row .mont');
    var box = hero.querySelector('.card-promo');
    if (!cp) { if (box) box.hidden = true; return; }
    if (!box && priceEl) {
      box = document.createElement('div'); box.className = 'card-promo';
      var row = priceEl.closest('.price-row') || priceEl.parentNode;
      row.parentNode.insertBefore(box, row.nextSibling);
    }
    if (!box) return;
    var fill = function (t) { return String(t || '').replace('{code}', '<strong>' + cp.code + '</strong>').replace('{label}', cp.label); };
    var html;
    if (cp.note === '') {
      html = '✓ ' + fill(T.on) + ' <strong>' + fmtMoney(cp.price) + '</strong> <s>' + fmtMoney(cp.base) + '</s>'
           + '<div class="card-omnibus">' + String(T.omnibus || '').replace('{price}', fmtMoney(cp.base)) + '</div>';
    } else if (cp.note === 'bundle') {
      var q = qtyMap(), missing = cp.ids.filter(function (b) { return !(q[b] > 0) && CATALOG[b] && onSale(b); });
      html = '🎁 ' + fill(T.bundle) + (missing.length
        ? ' <button type="button" class="btn btn-gold card-promo-add">' + String(T.bundleAdd || '').replace('{price}', fmtMoney(cp.bundle)) + '</button>'
        : ' ' + (T.bundleIn || ''));
    } else if (cp.note === 'ladder') html = 'ℹ️ ' + fill(T.ladder);
    else html = 'ℹ️ ' + fill(T.scope);
    box.innerHTML = html; box.hidden = false;
    var btn = box.querySelector('.card-promo-add');
    if (btn) btn.addEventListener('click', function () { addBundle(); location.href = CART_PAGE_URL(); });
  }
  function CART_PAGE_URL() { return (CB.cartPage || 'kosik.html'); }

  var Cart = {
    CATALOG: CATALOG,
    SETS: SETS,
    PROMOS: PROMOS,
    items: read,
    unitPrice: unitPrice,
    regularUnit: regularUnit,
    nextTier: nextTier,
    lineSavings: lineSavings,
    showsSaving: showsSaving,
    suggestSet: suggestSet,
    convertToSet: convertToSet,
    setContents: setContents,
    activePromo: activePromo,
    applyPromo: applyPromo,
    clearPromo: clearPromo,
    promoDef: promoDef,
    promoUnit: promoUnit,
    promoLineDiscount: promoLineDiscount,
    promoSavings: promoSavings,
    promoNote: promoNote,
    promoStartsText: promoStartsText,
    bundleMissing: bundleMissing,
    addBundle: addBundle,
    defaultCarrier: function () { return DEFAULT_CARRIER[market] || null; },
    onSale: onSale,
    listed: listed,
    takesCodes: takesCodes,
    WINDOWS: WINDOWS,
    maxQty: maxQty,
    today: today,                 // Y-m-d on the Prague clock (or ?cb_today=) — the Christmas page reads it too
    pragueDay: pragueDay,
    cardPromo: cardPromo,         // the active code's effect on one product's card price (home page offer, 2026-11-24)
    /* `silent` (optional, home page «buy now» only — ported from the Polish shop 2026-11-24): no «Do košíku» window,
       the caller goes straight to the cart. Everything else (limit, dataLayer add_to_cart) is the same. */
    add: function (id, qty, silent) {
      if (!CATALOG[id] || !onSale(id)) { return; }
      qty = qty || 1;
      var items = read();
      var row = items.filter(function (i) { return i.id === id; })[0];
      var had = row ? row.qty : 0;
      if (row) { row.qty = capQty(id, row.qty + qty); } else { items.push({ id: id, qty: capQty(id, qty) }); }
      qty = (row ? row.qty : capQty(id, qty)) - had;
      write(items);
      if (qty <= 0) { if (!silent) notify(id, 0); return; }     // already at the per-order limit: just show the cart prompt
      dl({ ecommerce: null });
      dl({ event: 'add_to_cart', ecommerce: { currency: PRICES[market].currency, value: unitPrice(id, qty) * qty, items: [ecomItem(id, qty)] } });
      if (!silent) notify(id, qty);
    },
    setQty: function (id, qty) {
      var items = read().map(function (i) { return i.id === id ? { id: id, qty: capQty(id, qty) } : i; })
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
  Cart.paintCards = paintCards;

  /* Set cards in the catalog (owner 2026-11-01: the photo carries no price and no badge — «бирочки» and the saving are
     drawn here, from this file's own prices, so they can never fall behind the cart): a «−N %» pill (the set against its
     items bought separately), an optional tag from lang.js (CB.setTags), the struck price and «ušetříte …». */
  function decorateSetCards() {
    var T = CB.t || {}, TAGS = CB.setTags || {};
    [].forEach.call(document.querySelectorAll('article.card'), function (card) {
      if (card.getAttribute('data-set-deco')) return;
      var btn = card.querySelector('[data-cb-add]'), img = card.querySelector('.cat-card-img');
      if (!btn || !img || img.parentElement.tagName !== 'A') return;
      var id = btn.getAttribute('data-cb-add'), p = CATALOG[id];
      if (!p || !p.orig || p.orig <= p.price || WINDOWS[id]) return;
      card.setAttribute('data-set-deco', '1');
      var a = img.parentElement; a.classList.add('set-ph');
      var shows = showsSaving(id);                 // no pill / struck price / saving for NO_SAVING_SHOWN, tag only
      if (shows) {
        var pill = document.createElement('span'); pill.className = 'set-pct';
        pill.textContent = '−' + Math.round((p.orig - p.price) / p.orig * 100) + ' %'; a.appendChild(pill);
      }
      if (TAGS[id]) { var tag = document.createElement('span'); tag.className = 'set-tag'; tag.textContent = TAGS[id]; a.appendChild(tag); }
      var pr = card.querySelector('.cb-card-buy .mont');
      if (!pr || !shows) return;
      var box = document.createElement('span'); box.className = 'set-prices';
      pr.parentNode.insertBefore(box, pr);
      var old = document.createElement('s'); old.className = 'set-old'; old.textContent = fmtMoney(p.orig);
      var save = document.createElement('span'); save.className = 'set-save';
      save.textContent = String(T.youSave || '').replace('{n}', fmtMoney(p.orig - p.price));
      box.appendChild(old); box.appendChild(pr); box.appendChild(save);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateSetCards); else decorateSetCards();
  document.addEventListener('cart:change', paintCards);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintCards); else paintCards();

  /* Cart link from a letter or a chat funnel, e.g. kosik.html?add=balzam-500,l-glutamine&promo=VRACIME —
     the link REPLACES the cart with one unit of each listed product (owner 2026-10-29: a chat buyer who
     tapped «500 ml», then «250 ml», then a programme got all three, thousands of crowns). Then `add`
     leaves the address, so a reload keeps whatever the buyer changed since. A link with nothing sellable
     in it leaves the cart alone. The gift of a bundle code is put in afterwards (`coupon=` below).
     `count=N` with a single product puts N of it (2026-10-30: the old Bitrix basket links carry
     `offerID=…&count=2`, e.g. the «2 bottles −15 %» button of the after-delivery letter — the switch-day
     redirect keeps the query string, so the count arrives here). Capped at 20.
     Ported from the Polish shop (2026-10-26), where a link still only adds.
     An id this shop no longer sells but old letters and chat funnels still carry is read as its successor
     (RETIRED below): `kolagen` — Kolagen by Bolotov, gone since 2026-11-09 — puts the 20-shot box of Marine
     Collagen Shots in, the product its page now 301s to (owner 2026-11-08). Before, such a link left the cart
     empty without a word (audit 2026-11-10, item 13). The link's code (`promo=` / `coupon=`) is untouched. */
  Cart.RETIRED = RETIRED;
  (function () {
    try {
      var m = /[?&]add=([^&#]+)/i.exec(location.search);
      if (!m) return;
      var items = [], added = [];
      var cm = /[?&]count=(\d+)/i.exec(location.search);
      var count = cm ? Math.min(20, Math.max(1, parseInt(cm[1], 10) || 1)) : 1;
      decodeURIComponent(m[1]).split(',').forEach(function (id) {
        id = String(id).trim();
        if (RETIRED[id] && !CATALOG[id]) id = RETIRED[id];
        if (!CATALOG[id] || !onSale(id) || items.some(function (i) { return i.id === id; })) return;
        items.push({ id: id, qty: 1 }); added.push(id);
      });
      if (items.length === 1) items[0].qty = count;
      if (added.length) {
        write(items);
        dl({ ecommerce: null });
        dl({ event: 'add_to_cart', ecommerce: { currency: PRICES[market].currency,
          value: items.reduce(function (s, i) { return s + unitPrice(i.id, i.qty) * i.qty; }, 0),
          items: items.map(function (i) { return ecomItem(i.id, i.qty); }) } });
      }
      if (window.history && history.replaceState) {
        var qs = location.search.replace(/([?&])add=[^&#]*&?/i, '$1').replace(/([?&])count=\d+&?/i, '$1').replace(/[?&]$/, '');
        history.replaceState(null, '', location.pathname + qs + location.hash);
      }
    } catch (e) {}
  })();

  /* CZ ↔ SK switch (the header pill, data-cb-switch): the same page on the other shop, WITH the cart —
     a Slovak who filled a basket on the Czech site must not arrive at an empty one (2026-10-26). The
     cart rides as ?cbcart=id:qty,…; a code rides too when the other market has the same word. The
     arriving page puts the items in (merging with anything already there), opens in its own market,
     and drops the parameters from the address. */
  (function () {
    try {
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[data-cb-switch]');
        if (!a) return;
        var items = read(); if (!items.length) return;
        var u = new URL(a.href);
        u.searchParams.set('cbcart', items.map(function (i) { return i.id + ':' + i.qty; }).join(','));
        var other = market === 'CZ' ? 'SK' : 'CZ', c = activePromo();
        if (c && ((CB.promoMarket === other ? CB.promos : (CB.promosAlt || {})[other]) || {})[c]) u.searchParams.set('promo', c);
        a.href = u.toString();
      }, true);
      var m = /[?&]cbcart=([^&#]+)/.exec(location.search);
      if (!m) return;
      var have = read(), byId = {};
      have.forEach(function (i) { byId[i.id] = i; });
      decodeURIComponent(m[1]).split(',').forEach(function (part) {
        var bits = part.split(':'), id = String(bits[0] || '').trim(), qty = Math.max(1, Math.min(99, parseInt(bits[1], 10) || 1));
        if (!CATALOG[id] || !onSale(id)) return;
        if (byId[id]) byId[id].qty = Math.max(byId[id].qty, qty); else { byId[id] = { id: id, qty: qty }; have.push(byId[id]); }
      });
      if (CB.market && CB.market !== market) setMarket(CB.market);
      write(have);
      if (window.history && history.replaceState) {
        var qs = location.search.replace(/([?&])cbcart=[^&#]*&?/, '$1').replace(/[?&]$/, '');
        history.replaceState(null, '', location.pathname + qs + location.hash);
      }
    } catch (e) {}
  })();

  /* Blocks that exist only for a date range (the Christmas banner on the home page, the strip on
     the catalog): data-cb-show-from / data-cb-show-until, Y-m-d, until exclusive. */
  (function () {
    var t = today();
    var els = document.querySelectorAll('[data-cb-show-from]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.hidden = !(t >= el.getAttribute('data-cb-show-from') && t < el.getAttribute('data-cb-show-until'));
    }
    /* The seasonal notices above the header: on a phone only the first one shows, in one line, in place
       of the delivery strip (brand.css, 2026-10-28) — a tap opens the whole sentence. */
    var notes = document.querySelectorAll('.hol-note'), shown = 0;
    for (var j = 0; j < notes.length; j++) {
      if (notes[j].hidden) continue;
      if (shown++) notes[j].classList.add('hol-more');
      notes[j].addEventListener('click', function () { this.classList.toggle('open'); });
    }
    if (shown && document.body) document.body.classList.add('has-hol');
  })();

  /* Auto-apply a promo from a link, e.g. ...?promo=balsam15 — works site-wide and persists.
     `coupon=` too: it is what the Bitrix shop's links use (chat funnels, the printed Christmas card's
     QR → ?coupon=DEKUJEME, valid until 2027-02-01), and they will be pointed here. */
  (function () {
    try {
      var m = /[?&](?:promo|coupon)=([^&#]+)/i.exec(location.search);
      /* A word whose window opens later (the card's QR before 25.12): remember it and say when it starts.
         Once the window opens, the remembered word applies itself on the next visit from this browser. */
      if (m && promoPending(decodeURIComponent(m[1]))) {
        try { localStorage.setItem(PENDING_KEY, normPromo(decodeURIComponent(m[1]))); } catch (e) {}
      }
      if (!m) {
        var held = null; try { held = localStorage.getItem(PENDING_KEY); } catch (e) {}
        if (held && !promoPending(held)) {
          try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
          if (!activePromo()) applyPromo(held);
        }
      }
      if (m && applyPromo(decodeURIComponent(m[1]))) {
        /* A gift word arriving by LINK puts its items in the cart, as the Bitrix links did («the link
           to the 500 ml puts the 500 ml AND the 250 ml in»): old funnel and e-mail links redirected
           here keep their gift. Typed by hand in the cart, it only offers to add them. */
        var c = activePromo();
        if (c && PROMOS[c].type === 'bundle_prices' && bundleMissing().length) addBundle();
      }
    } catch (e) {}
  })();

  /* «Your code starts on …» — a pop-up for visitors who arrive from the card QR. The strip under the header that
     came first was dropped the same day (owner 2026-11-01: «убрать фразу… она уже лишняя»). */
  (function () {
    var held = null; try { held = localStorage.getItem(PENDING_KEY); } catch (e) {}
    var text = held ? promoStartsText(held) : '';
    if (!text) return;
    /* Arriving from the printed card's QR (utm_source=otkrytka-vanoce-…): the same words as a pop-up that
       only «OK» closes — the strip alone was easy to miss (owner 2026-11-01: «ее хрен увидишь там»,
       «как пушап… надо было нажать ОК… только для тех, кто QR-код отсканировал»). */
    if (!/[?&](?:promo|coupon)=/i.test(location.search) || !/[?&]utm_source=otkrytka-vanoce/i.test(location.search)) return;
    var box = document.createElement('div');
    box.className = 'promo-wait-modal';
    box.setAttribute('role', 'dialog');
    box.innerHTML = '<div class="pwm-card"><div class="pwm-ic">🎁</div><p></p><button type="button" class="btn btn-primary"></button></div>';
    box.querySelector('p').textContent = text.replace(/^🎁\s*/, '');
    box.querySelector('button').textContent = L.promoStartsBtn || 'OK';
    var close = function () { box.remove(); };
    box.querySelector('button').addEventListener('click', close);
    document.body.appendChild(box);
  })();

  /* Header cart link — shows what is in the cart as money, the way the live centerbolotova.eu
     header does («Celková cena …»), instead of the Polish shop's item count (owner, 2026-09-15).
     The figure is the one the cart page shows for the goods: ladder and set prices, minus an
     active code; delivery is chosen later, so it is not in it. An empty cart shows just the label. */
  function renderBadge() {
    var n = Cart.count();
    var sum = n > 0 ? Math.max(0, Cart.subtotal() - promoSavings()) : 0;
    var links = document.querySelectorAll('.header-actions a[href="' + CART_PAGE + '"]');
    for (var i = 0; i < links.length; i++) {
      links[i].innerHTML = n > 0
        ? '<span class="cart-word">' + L.cartLink + ' · </span><span class="cart-sum">' + fmtMoney(sum) + '</span>'
        : L.cartLink;
    }
  }

  /* Add-to-cart popup with actions (go to cart / continue shopping).
     2026-11-19 (owner: the familiar «go to cart / continue shopping» choice): a real modal — focus moves to «go to
     cart» and stays inside, Esc / × / a tap outside close it and give focus back — plus the cart's count and value
     (L.inCartSum), and a dataLayer event for every way out, so GA4 can show how many add and never open the cart:
       cart_prompt_view · cart_prompt_go · cart_prompt_continue {prompt_method: button | close | outside | esc}.
     The phone shortcut on product / set pages (straight to the cart, below) shows no prompt and sends none of them. */
  var popEl, popBack;
  function popClose(method) {
    if (!popEl || !popEl.classList.contains('show')) return;
    popEl.classList.remove('show');
    dl({ event: 'cart_prompt_continue', prompt_method: method });
    if (popBack && popBack.focus && document.contains(popBack)) { try { popBack.focus(); } catch (e) {} }
    popBack = null;
  }
  function notify(id, qty) {
    var p = CATALOG[id]; if (!p) return;
    // Never on the cart page itself — the visitor is already there (a chat link `?add=` lands here and shows none).
    if (document.getElementById('order-form')) return;
    /* On a phone, the product or set page's button goes straight to the cart — no window to read and
       close first (the Bitrix shop does the same since 2026-10-23). The catalog keeps the window, where
       people add several things in a row. */
    try {
      if (document.querySelector('.pd-hero') && window.matchMedia('(max-width: 767px)').matches) {
        location.href = CART_PAGE; return;
      }
    } catch (e) {}
    if (!popEl) {
      popEl = document.createElement('div');
      popEl.className = 'cart-pop';
      popEl.innerHTML =
        '<div class="cart-pop-box" role="dialog" aria-modal="true" aria-labelledby="cart-pop-title">' +
        '<button class="cart-pop-x" type="button" aria-label="' + L.close + '">&times;</button>' +
        '<div class="cart-pop-head"><span class="cart-pop-tick" aria-hidden="true">✓</span><span id="cart-pop-title">' + L.added + '</span></div>' +
        '<div class="cart-pop-prod"></div>' +
        '<div class="cart-pop-actions">' +
        '<a class="btn btn-gold cart-pop-go" href="' + CART_PAGE + '">' + L.goToCart + '</a>' +
        '<button class="btn btn-ghost cart-pop-cont" type="button">' + L.keepShopping + '</button>' +
        '</div></div>';
      document.body.appendChild(popEl);
      popEl.querySelector('.cart-pop-x').addEventListener('click', function () { popClose('close'); });
      popEl.querySelector('.cart-pop-cont').addEventListener('click', function () { popClose('button'); });
      popEl.querySelector('.cart-pop-go').addEventListener('click', function () { dl({ event: 'cart_prompt_go' }); });
      popEl.addEventListener('click', function (e) { if (e.target === popEl) popClose('outside'); });
      document.addEventListener('keydown', function (e) {
        if (!popEl.classList.contains('show')) return;
        if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); popClose('esc'); return; }
        if (e.key !== 'Tab') return;                       // keep Tab inside the dialog
        var f = popEl.querySelectorAll('a[href], button'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
    var n = Cart.count(), sum = Math.max(0, Cart.subtotal() - promoSavings());
    var thumb = p.img ? '<img src="' + p.img + '" alt="">' : '';
    popEl.querySelector('.cart-pop-prod').innerHTML =
      thumb + '<div><strong>' + p.name + '</strong><div class="muted" style="font-size:13px">'
      + L.qtyLabel + ' ' + (qty || 1) + '</div>'
      + '<div class="cart-pop-sum">' + String(L.inCartSum || '').replace('{n}', n).replace('{sum}', fmtMoney(sum)) + '</div></div>';
    if (!popEl.classList.contains('show')) popBack = document.activeElement;
    popEl.classList.add('show');
    dl({ event: 'cart_prompt_view' });
    try { popEl.querySelector('.cart-pop-go').focus({ preventScroll: true }); } catch (e) {}
  }

  /* «Do košíku» straight from a card in the catalog or on the home page (owner 2026-10-28: no detour
     through the product page; the balsam card carries one button per volume). The card's picture and
     title still open the product page. A product that is not on sale today opens its page instead. */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-cb-add]') : null;
    if (!b) return;
    e.preventDefault();
    var id = b.getAttribute('data-cb-add');
    if (CATALOG[id] && onSale(id)) { Cart.add(id, 1); return; }
    var href = b.getAttribute('data-href');
    if (href) location.href = href;
  });

  /* The header sum also moves when the market (price list) or the discount code changes, not only
     when items do — every one of those announces itself as cart:change. */
  document.addEventListener('cart:change', renderBadge);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBadge);
  } else {
    renderBadge();
  }
})();

/* Back-to-top button (global) */
(function () {
  function init() {
    // Not on the checkout: there it sat on top of the form fields on a phone, and a form is
    // filled downwards, not left for the top.
    if (document.getElementById('order-form')) return;
    var L = (window.CB && window.CB.t) || {};
    var b = document.createElement('button');
    b.className = 'to-top'; b.setAttribute('aria-label', L.toTop); b.innerHTML = '↑';
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(b);
    var onScroll = function () { b.classList.toggle('show', window.scrollY > 500); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Header on phones and tablets (owner, 2026-11-01: «закрывает пол экрана»): it slides away while the
   visitor scrolls down and comes back the moment they scroll up. Desktop keeps it fixed (brand.css,
   `.hdr-hide` only acts below 1101 px). Never hidden near the top or while the burger menu is open. */
(function () {
  var h = document.querySelector('.site-header');
  if (!h) return;
  var last = window.scrollY, ticking = false;
  var update = function () {
    ticking = false;
    var y = window.scrollY, nav = document.querySelector('.nav');
    if (y < h.offsetHeight || (nav && nav.classList.contains('open'))) h.classList.remove('hdr-hide');
    else if (y > last + 6) h.classList.add('hdr-hide');
    else if (y < last - 6) h.classList.remove('hdr-hide');
    if (Math.abs(y - last) > 6 || y < h.offsetHeight) last = y;
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
})();

/* Global lightbox for review images (balzam carousel + opinie grid) */
(function () {
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function init() {
    var L = (window.CB && window.CB.t) || {};
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-x" aria-label="' + L.close + '">&times;</button><img alt="' + L.reviewAlt + '">';
    document.body.appendChild(lb);
    var img = lb.querySelector('img');
    function close() { lb.classList.remove('show'); img.src = ''; }
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    /* Listeners sit on the review containers and the product photo themselves, not on `document`:
       iPhone Safari does not deliver a tap on a plain <img> to a listener on the document, so the
       reviews did not open on phones (owner, 2026-11-01). */
    function open(e) {
      var t = e.target;
      /* a review card shows a small thumbnail; data-full is the whole screenshot (shops/reviews/, 2026-11-10) */
      if (t && t.tagName === 'IMG') { img.src = t.getAttribute('data-full') || t.currentSrc || t.src; lb.classList.add('show'); }
    }
    [].forEach.call(document.querySelectorAll('.rev-track, .reviews-grid, .story-strip'), function (el) { el.addEventListener('click', open); });
    var gm = document.getElementById('gmain');
    if (gm && !FINE) gm.addEventListener('click', open);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Product pages on a phone: once the page's own «add to cart» button scrolls away, a bar at the bottom carries the
   price and the same button (owner 2026-11-01: «как в хороших магазинах»). The bar only clicks the real button, so
   the variant, quantity and everything that button does stay where they are. */
(function () {
  function init() {
    if (!window.matchMedia('(max-width:767px)').matches) return;
    var q = document.querySelector('.pd-hero .qsel');
    var buy = q && q.parentElement && q.parentElement.querySelector('.btn');
    if (!buy) return;
    var price = document.querySelector('.pd-hero #price') || document.querySelector('.pd-hero .price-row .mont');
    var bar = document.createElement('div');
    bar.className = 'buybar';
    bar.innerHTML = '<span class="buybar-price"></span><button type="button" class="btn btn-gold"></button>';
    bar.querySelector('button').textContent = buy.textContent.trim();
    bar.querySelector('button').addEventListener('click', function () { buy.click(); });
    document.body.appendChild(bar);
    var shown = false;
    function update() {
      var r = buy.getBoundingClientRect();
      var off = r.bottom < 0 || r.top > window.innerHeight;
      if (price) bar.querySelector('.buybar-price').textContent = price.textContent.trim();
      if (off !== shown) { shown = off; bar.classList.toggle('show', off); document.body.classList.toggle('has-buybar', off); }
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Product photo magnifier, as on the HataVia landing (owner 2026-10-27: «лупа внутри», not a click
   that opens the photo full-screen). With a mouse the photo zooms 2.2× under the cursor inside its
   card; touch screens have no hover, so a tap still opens the lightbox above. */
(function () {
  function init() {
    var g = document.getElementById('gmain');
    if (!g || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var box = g.parentElement, t = null;
    box.classList.add('gzoom');
    function at(e) {
      var r = g.getBoundingClientRect();
      var x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      var y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
      g.style.transformOrigin = x + '% ' + y + '%';
    }
    box.addEventListener('mouseenter', function (e) { clearTimeout(t); at(e); box.classList.add('hz'); });
    box.addEventListener('mousemove', function (e) { at(e); box.classList.add('hz'); });
    box.addEventListener('mouseleave', function () { box.classList.remove('hz'); t = setTimeout(function () { g.style.transformOrigin = ''; }, 300); });
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
  /* Money here follows the cart's market, exactly like every other price on the page.
     (It used to hard-print "CZK", so a visitor who switched the cart to Slovakia saw
     Slovak euro amounts labelled in crowns \u2014 fixed 2026-08-15.) */
  function fmt(n) { return window.Cart ? Cart.fmt(n) : String(n); }
  function render(excludeId) {
    var foot = document.querySelector('footer.site-footer');
    if (!foot || !window.Cart) return;
    var ids = read().filter(function (x) { return x !== excludeId && Cart.CATALOG[x]; }).slice(0, SHOWN);
    if (!ids.length) return;
    var cards = ids.map(function (id) {
      var p = Cart.CATALOG[id];
      var price = p.orig && !(Cart.showsSaving && !Cart.showsSaving(id))
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
      + '<h2 class="title" style="text-align:left;font-size:24px;margin-bottom:20px">'
      + ((window.CB && window.CB.t && window.CB.t.recentTitle) || '') + '</h2>'
      + '<div class="recent-row">' + cards + '</div></div>';
    var mn = document.getElementById('main');   // inside the page's <main> landmark (2026-11-24); older pages: above the footer
    if (mn) mn.appendChild(sec); else foot.parentNode.insertBefore(sec, foot);
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

    var CB = window.CB || {}, L = CB.t || {}, E = L.exit || {};
    var WA = CB.wa || '';
    var CART_PAGE = CB.cartPage || 'kosik.html';
    function build() {
      el = document.createElement('div');
      el.className = 'exit-pop';
      if (mode === 'cart') {
        el.innerHTML = '<div class="exit-box">'
          + '<button class="exit-x" aria-label="' + L.close + '">&times;</button>'
          + '<h3 class="exit-h">' + E.cartTitle + '</h3>'
          + '<p class="exit-p">' + E.cartText + '</p>'
          + '<div class="exit-actions"><a class="btn btn-gold" href="' + CART_PAGE + '">' + E.backToCart + '</a>'
          + '<a class="btn btn-wa" href="' + WA + '">' + E.writeWa + '</a></div></div>';
      } else {
        el.innerHTML = '<div class="exit-box exit-box-guide">'
          + '<button class="exit-x" aria-label="' + L.close + '">&times;</button>'
          + '<div class="exit-cover"><img src="' + E.guideCover + '" alt="' + E.guideCoverAlt + '"></div>'
          + '<div class="exit-body"><h3 class="exit-h">' + E.guideTitle + '</h3>'
          + '<p class="exit-p">' + E.guideText + '</p>'
          + '<form class="exit-form" novalidate onsubmit="return false">'
          + '<input type="email" required placeholder="' + E.emailPlaceholder + '">'
          + '<label class="exit-consent"><input type="checkbox" name="marketing"><span>' + E.consent + '</span></label>'
          + '<p class="exit-mini" style="margin:0">' + (E.privacy || '') + '</p>'
          + '<button class="btn btn-gold" type="submit">' + E.submit + '</button></form>'
          + '<p class="exit-mini">' + E.noSpam + '</p></div></div>';
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
        /* Our own validation, so the message is in the site's language rather than the
           browser's locale-dependent native bubble. */
        var oldErr = form.querySelector('.cb-field-err'); if (oldErr) oldErr.remove();
        if (inp) inp.classList.remove('cb-invalid');
        var badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        /* The mailing box is optional (2026-11-16, websites#29): the guide PDF is handed out right here either way,
           and only a ticked box starts the follow-up e-mails — the server records that consent on the amoCRM deal. */
        if (badEmail) {
          var h = document.createElement('div'); h.className = 'cb-field-err'; h.textContent = email ? E.emailBad : E.emailEmpty;
          if (inp) { inp.classList.add('cb-invalid'); inp.parentNode.insertBefore(h, inp.nextSibling); try { inp.focus(); } catch (er) {} }
          return;
        }
        var mk = !!(cbx && cbx.checked);
        var mkText = mk ? String(((cbx.closest('label') || cbx.parentNode).textContent) || '').trim() : '';
        markGuide(); snooze(COOLDOWN_CONVERT); // converted → mark guide taken, don't nag again
        /* POST to the backend → amoCRM (neразобранное, tag Exit-intent) + SendPulse
           guide address book. Always resolves; the thank-you shows regardless. */
        try {
          fetch('/api/lead', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, source: 'exit-intent', marketing: mk, consent_text: mkText, page: location.pathname })
          }).catch(function () {});
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', lead_source: 'exit-intent' });
        } catch (err) {}
        el.querySelector('.exit-body').innerHTML =
          '<h3 class="exit-h">' + E.thanksTitle + '</h3>'
          + '<p class="exit-p"><a class="btn btn-gold" href="' + E.guidePdf + '" target="_blank" rel="noopener">' + E.guidePdfLabel + '</a></p>'
          + (mk ? '<p class="exit-p">' + E.thanksText + '</p>' : '');
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

/* Schema.org Product on product and set pages, for search results with a price (audit 2026-10-26: the
   Polish base carries it, the Czech/Slovak pages lost it in translation). Built from the cart's own price
   list — the one verify-catalog.php holds to the canon — so it cannot drift from what the cart charges.
   Since 2026-11-14 the product pages carry this block in the page itself, with shipping and returns
   (tools/gen-product-ld.py); this only fills in on a page that has none, never a second block. */
(function () {
  try {
    var id = document.body && document.body.getAttribute('data-recent');
    if (!id || !window.Cart || !Cart.CATALOG[id]) return;
    var have = document.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < have.length; j++) {
      try { if ((JSON.parse(have[j].textContent) || {})['@type'] === 'Product') return; } catch (e2) {}
    }
    var ids = [id], v = document.querySelectorAll('.pd-hero [data-id]');
    for (var i = 0; i < v.length; i++) { var x = v[i].getAttribute('data-id'); if (Cart.CATALOG[x] && ids.indexOf(x) < 0) ids.push(x); }
    var prices = ids.map(function (k) { return Cart.unitPrice(k, 1); });
    var attr = function (sel, a) { var e = document.querySelector(sel); return e ? (e.getAttribute(a) || '') : ''; };
    var h1 = document.querySelector('h1');
    var stock = 'https://schema.org/InStock', cur = Cart.currency(), url = attr('link[rel="canonical"]', 'href');
    var offers = prices.length > 1
      ? { '@type': 'AggregateOffer', priceCurrency: cur, lowPrice: String(Math.min.apply(null, prices)), highPrice: String(Math.max.apply(null, prices)), offerCount: String(prices.length), availability: stock }
      : { '@type': 'Offer', priceCurrency: cur, price: String(prices[0]), availability: stock, url: url };
    var ld = { '@context': 'https://schema.org', '@type': 'Product',
      name: h1 ? h1.textContent.trim() : Cart.CATALOG[id].name,
      image: attr('meta[property="og:image"]', 'content'), description: attr('meta[name="description"]', 'content'),
      brand: { '@type': 'Brand', name: 'Centrum Bolotova' }, offers: offers };
    var s = document.createElement('script');
    s.type = 'application/ld+json'; s.text = JSON.stringify(ld);
    document.head.appendChild(s);
  } catch (e) {}
})();

/* Phones: once the buyer has scrolled past the card's own «add to cart» button (reading the tabs, the
   reviews), a bottom bar keeps the price and that button in reach — it presses the real button, so the
   volume, the quantity and a code's price stay the card's own. The Polish card got it 2026-10-23
   (DECISIONS «buy bar»); here the button already sits on the first screen, so the bar only appears
   after it has scrolled away (audit 2026-10-26). No words of its own: it copies the page's. */
(function () {
  try {
    var hero = document.querySelector('.pd-hero');
    if (!hero || !document.body.getAttribute('data-recent') || !window.IntersectionObserver) return;
    var real = [].filter.call(hero.querySelectorAll('.btn-gold'), function (b) { return !b.closest('.card-promo'); })[0];
    if (!real) return;
    var bar = document.createElement('div');
    bar.className = 'm-paybar'; bar.hidden = true;
    bar.innerHTML = '<span><strong class="mpb-price"></strong></span><button type="button" class="btn btn-gold"></button>';
    document.body.appendChild(bar);
    var btn = bar.querySelector('button'), price = bar.querySelector('.mpb-price');
    btn.addEventListener('click', function () { real.click(); });
    var priceOf = function () {
      var cp = hero.querySelector('.card-promo:not([hidden]) > strong:nth-of-type(2)');
      var p = cp || hero.querySelector('#price') || hero.querySelector('.price-row .mont');
      return p ? p.textContent.trim() : '';
    };
    var past = false;
    var sync = function () {
      price.textContent = priceOf(); btn.textContent = real.textContent.trim();
      bar.hidden = !past || window.innerWidth > 768;
      document.body.classList.toggle('has-paybar', !bar.hidden);
    };
    new IntersectionObserver(function (e) {
      past = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;   // above the screen, not below it
      sync();
    }).observe(real);
    document.addEventListener('cart:change', sync);
  } catch (e) {}
})();
