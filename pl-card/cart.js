/* Centrum Bolotova — client-side cart (localStorage).
   Handles add/update/remove, Balzam 500 ml quantity tiers, header counter badge,
   and an add-to-cart toast. Stripe charging is wired separately (needs keys). */

/* ===== Ad attribution capture (UTM only) — first-touch, per session =====
   Loaded on every page (cart.js is site-wide). The order form later forwards these to
   /api/order so the amoCRM lead carries the channel/campaign (GA4 reads utm from the URL
   on its own; the CRM did not until now). First-touch: keep the first non-empty value
   across the visit, so browsing to other pages before the cart never wipes the original
   params. Exposed via window.cbAttribution() for koszyk to merge into the order payload.

   The ad-network CLICK IDS (gclid / fbclid / yclid) are deliberately NOT captured any more
   (owner, 2026-09-06, issue #36). They were the hardest part of this storage to defend as
   "strictly necessary" under ePrivacy, and nothing actually read them: every channel report
   in the analytics repo keys off utm_source, and the click ids only ever sat unused in the
   amoCRM deal. The utm_* labels stay — they are what the customer carried in the link and
   what the reports need. If a Meta Conversions API is ever wired up for this shop, fbclid
   has to come back, gated on the "marketing" consent category (see ROADMAP.md). */
(function () {
  try {
    var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term',
                'utm_referrer'];
    var qs = new URLSearchParams(location.search);
    var store = {};
    try { store = JSON.parse(sessionStorage.getItem('cbAttribution') || '{}') || {}; } catch (_e) { store = {}; }
    var changed = false;
    KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v && !store[k]) { store[k] = v.slice(0, 255); changed = true; }
    });
    // The chat contact the order button came from (`spc={{contact_id}}` on the bots' links): a Messenger
    // UUID or a 24-hex Instagram id. The order hands it to the backend, which tags that contact as a buyer
    // so the bot's «did you manage to order?» skips them. Last touch, unlike the utm_* above — it names a
    // person, not a campaign.
    var spc = (qs.get('spc') || '').toLowerCase();
    if (/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{24})$/.test(spc) && store.sp_contact !== spc) {
      store.sp_contact = spc; changed = true;
    }
    // First external referrer (ignore same-host navigations).
    if (!store.referrer && document.referrer && document.referrer.indexOf(location.host) === -1) {
      store.referrer = document.referrer.slice(0, 255); changed = true;
    }
    if (changed) { try { sessionStorage.setItem('cbAttribution', JSON.stringify(store)); } catch (_e) {} }
    window.__cbAttribution = store;
  } catch (_e) {}
})();
/* ===== Retention of the checkout's saved copies (PII audit 2026-11-16) =====
   koszyk.html (CBKeep) keeps what the buyer typed (`cb_checkout_v1`) and an unpaid card order (`cb_pending_order_v1`)
   for 7 days, stamped with `at`, and drops them on read — but only on the cart page, so a buyer who never came back
   kept them forever. This sweep runs on every page (cart.js is site-wide) with the same 7-day rule; a copy without a
   readable `at` goes too. The thank-you page still clears both after an order, as before. */
(function () {
  try {
    var TTL = 7 * 86400000, now = Date.now();
    ['cb_checkout_v1', 'cb_pending_order_v1'].forEach(function (k) {
      var raw = localStorage.getItem(k);
      if (raw === null) return;
      var o = null;
      try { o = JSON.parse(raw); } catch (_e) { o = null; }
      if (!o || typeof o.at !== 'number' || now - o.at > TTL) localStorage.removeItem(k);
    });
  } catch (_e) {}
})();
window.cbAttribution = function () {
  var s = window.__cbAttribution || {};
  try { s = Object.assign({}, JSON.parse(sessionStorage.getItem('cbAttribution') || '{}'), s); } catch (_e) {}
  return s;
};

(function () {
  /* The set-swieta-* rows at the end are «Zdrowe Święta» 2026 — the Polish Christmas sets (canon sets 23–26),
     sold only from/until (inclusive): outside the window they are dropped below, and the server refuses
     them too (Catalog::onSale). */
  var CATALOG = {
    'balzam-250':            { name: 'Balzam Bolotova 250 ml', price: 149, img: 'assets/img/cat/balzam.webp', url: 'produkt-balzam.html' },
    'balzam-500':            { name: 'Balzam Bolotova 500 ml', price: 193, img: 'assets/img/cat/balzam.webp', url: 'produkt-balzam.html',
                               tiers: [{ min: 6, price: 153 }, { min: 3, price: 163 }, { min: 1, price: 193 }] },
    /* Marine Collagen Shots (20 / 30) and the night cream replace Kolagen by Bolotov (owner 2026-11-08). */
    'shots-20':              { name: 'Marine Collagen Shots 20 × 25 ml', price: 279, img: 'assets/img/cat/shots-20.webp', url: 'marine-collagen-shots.html',
                               tiers: [{ min: 3, price: 229 }, { min: 1, price: 279 }] },
    'shots-30':              { name: 'Marine Collagen Shots 30 × 25 ml', price: 329, img: 'assets/img/cat/shots-30.webp', url: 'marine-collagen-shots.html',
                               tiers: [{ min: 2, price: 296 }, { min: 1, price: 329 }] },
    'krem-noc':              { name: 'Krem na noc Collagen Deluxe 50 ml', price: 129, img: 'assets/img/cat/krem-noc.webp', url: 'krem-na-noc-collagen-deluxe.html' },
    'l-glutamine':           { name: 'L-Glutamine Gastric Restore Complex', price: 116, img: 'assets/img/cat/lglutamine.webp', url: 'l-glutamine.html' },
    'hyaluronic':            { name: 'Hyaluronic Acid + Vitamin C', price: 116, img: 'assets/img/cat/hyaluronic.webp', url: 'hyaluronic-acid-vitamin-c.html' },
    'biotin':                { name: 'Biotin Zinc Selenium', price: 71, img: 'assets/img/cat/biotin.webp', url: 'biotin-zinc-selenium.html' },
    'set-beauty-base':       { name: 'Zestaw Beauty Base System', price: 326, orig: 395, img: 'assets/img/sets/beauty-base-cat.webp', url: 'set-beauty-base.html' },
    'set-dzien-i-noc':       { name: 'Zestaw Dzień & Noc', price: 399, orig: 458, img: 'assets/img/sets/den-noc-cat.webp', url: 'set-dzien-i-noc.html' },
    'set-complete-skin-system': { name: 'Zestaw Complete Skin System', price: 499, orig: 574, img: 'assets/img/sets/complete-skin-cat.webp', url: 'set-complete-skin-system.html' },
    'set-total-beauty-support-system': { name: 'Zestaw Total Beauty Support System', price: 549, orig: 645, img: 'assets/img/sets/total-beauty-cat.webp', url: 'set-total-beauty-support-system.html' },
    'set-wlosy-i-paznokcie': { name: 'Zestaw Włosy & paznokcie', price: 359, orig: 400, img: 'assets/img/sets/vlasy-nehty-cat.webp', url: 'set-wlosy-i-paznokcie.html' },
    'set-kompletna-kuracja-anti-age': { name: 'Kompletna kuracja anti-age 8 tygodni', price: 1049, orig: 1212, img: 'assets/img/sets/anti-age-cat.webp', url: 'set-kompletna-kuracja-anti-age.html' },
    'set-refluks-zgaga':     { name: 'Set Program na Refluks i Zgagę', price: 281, orig: 354, img: 'assets/img/sets/refluks-cat.webp', url: 'set-refluks-zgaga.html' },
    'set-ciezkosc-wzdecia':  { name: 'Set Program na Uczucie Ciężkości i Wzdęcia', price: 209, orig: 233, img: 'assets/img/sets/ciezkosc-cat.webp', url: 'set-ciezkosc-wzdecia.html' },
    'set-trawienie-stawy':   { name: 'Set Trawienie & Stawy', price: 409, orig: 472, img: 'assets/img/sets/traveni-klouby-cat.webp', url: 'set-trawienie-stawy.html' },
    'set-kuracja-kolagenowa':{ name: 'Intensywna kuracja 8 tygodni', price: 538, orig: 658, img: 'assets/img/sets/intenzivni-cat.webp', url: 'set-kuracja-kolagenowa.html' },
    'set-restart':           { name: 'Set Restart', price: 856, orig: 1030, img: 'assets/img/sets/restart-shots-cat.webp', url: 'set-restart.html' },
    'set-swieta-dla-dwojga':   { name: 'Zdrowe Święta dla dwojga', price: 319, orig: 386, img: 'assets/img/swieta/dla-dwojga.webp', url: 'zdrowe-swieta.html#dla-dwojga', from: '2026-11-01', until: '' },
    'set-swieta-zimowy-zapas': { name: 'Zimowy zapas', price: 528, orig: 638, img: 'assets/img/swieta/zimowy-zapas.webp', url: 'zdrowe-swieta.html#zimowy-zapas', from: '2026-11-01', until: '' },
    'set-swieta-lekkie':       { name: 'Lekkie Święta', price: 281, orig: 380, img: 'assets/img/swieta/lekkie-swieta-stol.webp', url: 'zdrowe-swieta.html#lekkie-swieta', from: '2026-11-01', until: '' },
    'set-swieta-szybki':       { name: 'Szybki świąteczny komfort', price: 219, orig: 265, img: 'assets/img/swieta/szybki-komfort-stol.webp', url: 'zdrowe-swieta.html#szybki-komfort', from: '2026-11-01', until: '' }
  };

  /* Set compositions — which single products (and how many) make up each set.
     Used to cross-sell: when the cart holds products that form a set, offer the cheaper bundle.
     (Verified against each set's "Skład zestawu" and its struck-through regular price.) */
  var SETS = {
    'set-beauty-base':        { 'shots-20': 1, 'hyaluronic': 1 },
    'set-dzien-i-noc':        { 'shots-30': 1, 'krem-noc': 1 },
    'set-complete-skin-system': { 'shots-30': 1, 'krem-noc': 1, 'hyaluronic': 1 },
    'set-total-beauty-support-system': { 'shots-30': 1, 'krem-noc': 1, 'hyaluronic': 1, 'biotin': 1 },
    'set-wlosy-i-paznokcie':  { 'shots-30': 1, 'biotin': 1 },
    'set-kompletna-kuracja-anti-age': { 'balzam-500': 1, 'shots-30': 2, 'krem-noc': 1, 'hyaluronic': 2 },
    'set-refluks-zgaga':      { 'balzam-500': 1, 'l-glutamine': 1 },
    'set-ciezkosc-wzdecia':   { 'balzam-500': 1 },
    'set-trawienie-stawy':    { 'balzam-500': 1, 'shots-20': 1 },
    'set-kuracja-kolagenowa': { 'shots-30': 2 },
    'set-restart':            { 'balzam-500': 1, 'shots-20': 3 },
    'set-swieta-dla-dwojga':  { 'balzam-500': 2 },
    'set-swieta-zimowy-zapas':{ 'balzam-500': 3, 'balzam-250': 1 },
    'set-swieta-lekkie':      { 'balzam-500': 1, 'l-glutamine': 1, 'biotin': 1 },
    'set-swieta-szybki':      { 'balzam-250': 1, 'l-glutamine': 1 }
  };

  /* «Today» on the shop's clock — Europe/Prague, the zone the server compares every date in since 2026-11-10
     (backend/src/Config.php; Warsaw keeps the same time). The seasonal sets, the free-delivery window and the code
     windows (validFrom / validUntil) all read it, so the cart and the server change day at the same midnight; it was
     UTC here, and from 00:00 to 01:00 (02:00 in summer) the cart still took a code the server had already closed
     (audit 2026-11-10, item 8). Without Intl time zones (very old browsers) the Central European rule is applied by
     hand: UTC+1, UTC+2 from the last Sunday of March to the last Sunday of October, 01:00 UTC both. */
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

  /* Seasonal items exist only inside their dates: drop them from the catalogue outside, so nothing can
     add, show or suggest them, and a cart that still holds one simply loses it (read() below). */
  var TODAY = pragueDay();
  Object.keys(CATALOG).forEach(function (id) {
    var p = CATALOG[id];
    if ((p.from && TODAY < p.from) || (p.until && TODAY > p.until)) { delete CATALOG[id]; delete SETS[id]; }
  });

  /* Free delivery: the standing threshold, and a lower one inside a date window — mirror of canon
     delivery.PL.free_from / free_from_promo («Darmowa dostawa na Święta» 2026); the server decides the
     money (Catalog::freeFromOn), verify-pricing.php checks this copy. */
  var FREE_FROM = 500;
  // until '' = no end date (owner 2026-10-29: «надо снять 15.12, чтобы тоже не было срока»)
  var FREE_FROM_PROMO = { free_from: 150, from: '2026-11-01', until: '' };   // also in the <head> script of the [data-swieta] pages (docs/DEPLOY.md «Speed pass»)
  function freeFrom() {
    var p = FREE_FROM_PROMO;
    return (p && TODAY >= p.from && (!p.until || TODAY <= p.until)) ? Math.min(FREE_FROM, p.free_from) : FREE_FROM;
  }

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
    // a retired id becomes its successor; a seasonal set past its dates is gone
    return successors(Array.isArray(items) ? items : []).filter(function (i) { return CATALOG[i.id]; });
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
  /* Sets whose struck price and saving are never SHOWN (2026-11-10, audit item 6; shops/poland/docs/DECISIONS.md «Set Ciężkość i Wzdęcia shows no saving»): the «Ciężkość i Wzdęcia»
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
      if (CATALOG[setId].from) return;            // seasonal sets are bought from their page, never swapped in
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

  /* ===== Discount codes ==========================================================================
     The codes themselves are NOT written here by hand: they come from the canon register
     knowledge-base/finance/promos.json, generated into the block below by
     `backend/tools/gen-promos.php`. One register, three shops, same meaning everywhere.

     The rules the cart applies — the same ones the canon states:

       · one code at a time, kept in localStorage, entered in the cart or arrived via ?promo=CODE;
       · a code NEVER stacks with a quantity ladder or a komplet price — the customer pays the
         lower of the two, which is why the balsam code changes nothing from 3 pcs, where the
         ladder already gives that price;
       · `maxQty` — the code only reaches lines up to that quantity (the balsam code is for 1–2);
       · `validFrom` / `validUntil` — a date window, when the canon sets one.

     NOTE: this is still the visible/cart-side discount — the charge is built from the cart's
     total, so the codes here must stay generated, never hand-edited. */
  /* ===== PROMOS: GENERATED from knowledge-base/finance/promos.json — DO NOT EDIT ===== */
  /* Rebuild with: php backend/tools/gen-promos.php  (verify-catalog.php checks the copy) */
  var PROMO_ROUNDING = 1;
  var PROMOS = {
    'balsam15': { code: 'BALSAM15', type: 'unit_price', ids: ['balzam-500'], price: 164, maxQty: 2, label: 'Balsam 500 ml za 164 zł' },
    'urodziny': { code: 'URODZINY', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10% urodzinowy' },
    'wracamy': { code: 'WRACAMY', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10% powrót' },
    'recenzja20': { code: 'RECENZJA20', type: 'percent', ids: ['shots-20', 'shots-30', 'krem-noc', 'balzam-500', 'balzam-250', 'l-glutamine', 'hyaluronic', 'biotin'], percent: 20, scope: 'products', stacks: false, label: '−20% za recenzję' },
    'plan10': { code: 'PLAN10', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10% na produkty w cenie regularnej' },
    'sekret': { code: 'SEKRET', type: 'bundle_prices', ids: ['balzam-500', 'balzam-250'], prices: { 'balzam-500': 193, 'balzam-250': 0 }, validUntil: '2026-11-15', label: 'Balsam 500 ml + 250 ml w prezencie' },
  };
  /* ===== /PROMOS ===== */
  var PROMO_KEY = 'bolotov_promo_v1';
  function normPromo(code) { return (code || '').trim().toLowerCase(); }
  function promoLive(p) {
    if (!p) return false;
    var day = pragueDay();                                // Prague, as backend/src/Promos.php → find
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
    if (p.type !== 'unit_price') return ladder;
    if ((p.ids || []).indexOf(id) < 0) return ladder;
    if (p.maxQty && qty > p.maxQty) return ladder;      // ladder territory
    return Math.min(ladder, p.price);
  }
  /* A bundle_prices code (JESIEN) reaches only when every product of its set is in the cart; then
     ONE unit of each is charged at the set's price for it, never deeper than the line already is. */
  function bundleComplete(p) {
    var q = qtyMap();
    return (p.ids || []).length > 0 && (p.ids || []).every(function (id) { return (q[id] || 0) > 0; });
  }
  // Money the code takes off one line (0 when it does not reach it, or the ladder is already lower).
  function promoLineDiscount(id, qty) {
    var c = activePromo();
    if (c && PROMOS[c].type === 'bundle_prices') {
      var bp = PROMOS[c];
      if (!bundleComplete(bp) || !(id in (bp.prices || {}))) return 0;
      var off = unitPrice(id, qty) - bp.prices[id];
      return off > 0 ? Math.round(off * 100) / 100 : 0;
    }
    var d = (unitPrice(id, qty) - promoUnit(id, qty)) * qty;
    return d > 0 ? Math.round(d * 100) / 100 : 0;
  }
  // A percent code's cut of an amount, rounded UP to the market's step (in the customer's favour).
  function percentOff(p, amount) {
    var step = PROMO_ROUNDING || 1;
    return Math.ceil((amount * p.percent / 100) / step) * step;
  }
  // Money the code takes off the whole order — per-line for a unit_price code, a share of the
  // goods for a percent code.
  function promoSavings() {
    var c = activePromo(); if (!c) return 0;
    var p = PROMOS[c];
    if (p.type === 'percent') {
      var off  = function (amount) { return percentOff(p, amount); };
      var total = 0;
      read().forEach(function (i) {
        if ((p.scope || 'order') !== 'order' && (p.ids || []).indexOf(i.id) < 0) return;
        var line = unitPrice(i.id, i.qty) * i.qty;
        if (p.stacks) { total += off(line); return; }
        /* A personal code does not add itself to the shop's own discount: the line is worth the
           better of the two — the ladder or komplet price it already has, or the code's percentage
           off the regular price (owner's rule, promos.json → percent_codes_and_stacking). */
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
    if (p.type === 'bundle_prices') return 'bundle';                      // not all of the set in the cart
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
    return 'ladder';                                                      // ladder already lower
  }

  /* What a product or set CARD says about the active code, for one unit. A chat-funnel link opens
     the card with ?promo=CODE, and a card that shows the full price while the chat promised a
     discount loses the sale (2026-10-20: 39 funnel visits, 1 add-to-cart). Same rules as the cart:
       { code, label, maxQty, ids, base, price, bundle, note }
       base   — one unit without the code (ladder / komplet price for 1 pc);
       price  — one unit with the code;
       bundle — for a bundle_prices code, what the whole bundle costs;
       note   — '' the code lowers this price · 'bundle' a gift bundle that needs its other products ·
                'ladder' this price is already lower than the code's · 'scope' the code skips it. */
  function cardPromo(id) {
    var c = activePromo(); if (!c || !CATALOG[id]) return null;
    var p = PROMOS[c], ids = p.ids || [];
    var base = unitPrice(id, 1), price = base, note = '', bundle = 0;
    if (p.type === 'unit_price') {
      price = promoUnit(id, 1);
      if (price >= base) note = ids.indexOf(id) < 0 ? 'scope' : 'ladder';
    } else if (p.type === 'percent') {
      if ((p.scope || 'order') !== 'order' && ids.indexOf(id) < 0) { note = 'scope'; }
      else {
        // non-stacking: the better of the price it already has and the code off the regular price
        var reg = p.stacks ? base : regularUnit(id);
        var withCode = reg - percentOff(p, reg);
        if (withCode < base) price = withCode; else note = 'ladder';
      }
    } else if (p.type === 'bundle_prices') {
      note = ids.indexOf(id) < 0 ? 'scope' : 'bundle';
      ids.forEach(function (b) { bundle += (p.prices || {})[b] || 0; });
    } else { note = 'scope'; }
    return { code: (p.code || c).toUpperCase(), label: p.label || '', maxQty: p.maxQty || 0, ids: ids,
             base: base, price: price, bundle: bundle, note: note };
  }

  /* Put one unit of each product in the cart unless it is already there — a reload or a second
     click must not add more. Returns the ids actually added. */
  // `replace` starts from an empty cart instead of the current one (the cart link below); nothing sellable
  // in `ids` leaves the cart as it was, because nothing is written then.
  function addOnce(ids, replace) {
    var items = replace ? [] : read(), added = [];
    ids.forEach(function (id) {
      id = String(id).trim();
      if (!CATALOG[id] || items.some(function (i) { return i.id === id; })) return;
      items.push({ id: id, qty: 1 });
      added.push(id);
    });
    if (added.length) {
      write(items);
      dl({ ecommerce: null });
      dl({ event: 'add_to_cart', ecommerce: { currency: 'PLN',
        value: added.reduce(function (s, id) { return s + unitPrice(id, 1); }, 0),
        items: added.map(function (id) { return ecomItem(id, 1); }) } });
    }
    return added;
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
    cardPromo: cardPromo,
    addOnce: addOnce,
    freeFrom: freeFrom,
    pragueDay: pragueDay,         // Y-m-d on the Prague clock — the day every date window here is read against
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

  /* Set cards in the catalog, as on CZ/SK (owner 2026-11-01): no price or badge in the photo — a «−N %» pill (the set
     against its items bought separately), an optional tag, the struck price and «oszczędzasz …», all from CATALOG. */
  var SET_TAGS = { 'set-refluks-zgaga': 'Najczęściej wybierany', 'set-ciezkosc-wzdecia': 'Top wybór',
                   'set-complete-skin-system': 'TOP wybór', 'set-kuracja-kolagenowa': 'Najlepsza cena', 'set-total-beauty-support-system': 'Polecamy',
                   'set-kompletna-kuracja-anti-age': 'Premium', 'set-dzien-i-noc': 'Nowość', 'set-wlosy-i-paznokcie': 'Nowość', 'set-beauty-base': 'Na początek' };
  function decorateSetCards() {
    [].forEach.call(document.querySelectorAll('article.card'), function (card) {
      if (card.getAttribute('data-set-deco')) return;
      var img = card.querySelector('.cat-card-img'), a = img && img.parentElement;
      if (!a || a.tagName !== 'A') return;
      var id = (a.getAttribute('href') || '').replace(/\.html.*$/, ''), p = CATALOG[id];
      if (!p || !p.orig || p.orig <= p.price || p.from) return;
      card.setAttribute('data-set-deco', '1');
      a.classList.add('set-ph');
      var shows = showsSaving(id);                 // no pill / struck price / saving for NO_SAVING_SHOWN, tag only
      if (shows) {
        var pill = document.createElement('span'); pill.className = 'set-pct';
        pill.textContent = '−' + Math.round((p.orig - p.price) / p.orig * 100) + ' %'; a.appendChild(pill);
      }
      if (SET_TAGS[id]) { var tag = document.createElement('span'); tag.className = 'set-tag'; tag.textContent = SET_TAGS[id]; a.appendChild(tag); }
      var pr = card.querySelector('.mont');
      if (!pr || !shows) return;
      var box = document.createElement('span'); box.className = 'set-prices';
      pr.parentNode.insertBefore(box, pr);
      var old = document.createElement('s'); old.className = 'set-old'; old.textContent = p.orig + ' zł';
      var save = document.createElement('span'); save.className = 'set-save'; save.textContent = 'oszczędzasz ' + (p.orig - p.price) + ' zł';
      box.appendChild(old); box.appendChild(pr); box.appendChild(save);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateSetCards); else decorateSetCards();

  /* Cart link from a campaign or a chat funnel, e.g. koszyk?add=shots-20,balzam-250,hyaluronic&promo=BALSAM15 —
     the link REPLACES the cart with one unit of each listed product (owner 2026-10-29, as on the CZ/SK shop:
     a chat buyer who tapped «500 ml», then «250 ml», then a programme got all three). Then `add` leaves
     the address, so a reload keeps whatever the buyer changed since. A link with nothing sellable in it
     leaves the cart alone.
     An id this shop no longer sells but old letters still carry is read as its successor (RETIRED below):
     `kolagen` — Kolagen by Bolotov, gone since 2026-11-09 — puts the 20-shot box of Marine Collagen Shots in, the
     product its page now 301s to (owner 2026-11-08). Before, a letter's koszyk?add=kolagen&promo=WRACAMY left the
     cart empty without a word (audit 2026-11-10, item 13). The link's code (`promo=`) is untouched. */
  Cart.RETIRED = RETIRED;
  (function () {
    try {
      var m = /[?&]add=([^&#]+)/i.exec(location.search);
      if (!m) return;
      addOnce(decodeURIComponent(m[1]).split(',').map(function (id) {
        id = String(id).trim();
        return RETIRED[id] && !CATALOG[id] ? RETIRED[id] : id;
      }), true);
      if (window.history && history.replaceState) {
        var qs = location.search.replace(/([?&])add=[^&#]*&?/i, '$1').replace(/[?&]$/, '');
        history.replaceState(null, '', location.pathname + qs + location.hash);
      }
    } catch (e) {}
  })();

  /* The free-delivery threshold in the page text (top strip, the trust line under the buy button, Dostawa, FAQ) always
     says the day's threshold, whatever number the static HTML carries. Since 2026-11-10 the pages are written with the
     promo's 150 zł (the threshold the cart applies, no end date — audit tail 3); when the canon gives the promo an end
     date again, the top strip says until when, and after it every «od 150 zł» goes back to the standing 500 zł here
     without a page edit. Only the «Darmowa dostawa od N zł» / «dostawa jest bezpłatna» phrases are touched. */
  (function () {
    try {
      var at = freeFrom();
      var until = FREE_FROM_PROMO.until ? FREE_FROM_PROMO.until.split('-') : null;
      var top = document.querySelector('.topbar span');
      if (at < FREE_FROM && until && top && /Darmowa dostawa od \d+ zł/.test(top.textContent)) {
        top.textContent = '🎄 Darmowa dostawa na Święta od ' + at + ' zł — do ' + (+until[2]) + '.' + (+until[1]) + '.';
      }
      var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, hits = [];
      while ((n = walk.nextNode())) { if (/[Dd]ostaw|bezpłatn/.test(n.nodeValue) && /od \d+ zł/.test(n.nodeValue) && !/SCRIPT|STYLE/.test(n.parentNode.nodeName)) hits.push(n); }
      hits.forEach(function (node) {
        node.nodeValue = node.nodeValue.replace(/od (150|500) zł/g, function (m, v) { return (+v === 150 || +v === FREE_FROM) ? 'od ' + at + ' zł' : m; });
      });
    } catch (e) {}
  })();

  /* «Zdrowe Święta» strips ([data-swieta], home + catalog): visible only while the Christmas sets are on sale.
     The sets have no end date since 2026-10-29 (owner: until she switches them off), but the free delivery
     from 150 zł has no end date either since the same evening; its words ([data-swieta-deliv]) still follow the
     lower threshold, so an end date set again in the canon takes them away by itself. */
  (function () {
    try {
      var on = !!CATALOG['set-swieta-dla-dwojga'];
      document.querySelectorAll('[data-swieta]').forEach(function (el) { el.hidden = !on; });
      var deliv = freeFrom() < FREE_FROM;
      document.querySelectorAll('[data-swieta-deliv]').forEach(function (el) { el.hidden = !deliv; });
    } catch (e) {}
  })();

  /* Auto-apply a promo from a link, e.g. ...?promo=balsam15 — works site-wide and persists. */
  (function () {
    try {
      var m = /[?&]promo=([^&#]+)/i.exec(location.search);
      if (m) applyPromo(decodeURIComponent(m[1]));
    } catch (e) {}
  })();

  /* Product / set cards: show the price the active code gives, and say the code is on.
       [data-card-price="<id>"] — gets one unit's price, code included;
       [data-card-old="<id>"]   — gets the price without the code, shown only when the code lowers it;
       [data-card-promo="<id>"] — gets the line about the code (hidden when no code is active).
     The balsam card re-points these at the chosen volume and calls Cart.paintCards(). */
  function money(n) { return String(Math.round(n * 100) / 100).replace('.', ',') + ' zł'; }
  function eachCard(attr, fn) {
    var els = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < els.length; i++) fn(els[i], els[i].getAttribute(attr));
  }
  function paintCards() {
    eachCard('data-card-price', function (el, id) {
      var cp = cardPromo(id);
      el.textContent = money(cp && !cp.note ? cp.price : unitPrice(id, 1));
    });
    eachCard('data-card-old', function (el, id) {
      var cp = cardPromo(id), on = !!(cp && !cp.note);
      el.textContent = on ? money(cp.base) : '';
      el.hidden = !on;
    });
    eachCard('data-card-promo', function (box, id) {
      var cp = cardPromo(id);
      if (!cp) { box.hidden = true; box.innerHTML = ''; return; }
      var code = '<strong>' + cp.code + '</strong>', html;
      if (cp.note === '') {
        html = '✓ Kod ' + code + ' aktywny: ' + cp.label
             + (cp.maxQty ? ' (przy 1–' + cp.maxQty + ' szt.)' : '')
             + '. Rabat naliczy się automatycznie w koszyku.'
             + '<div class="card-omnibus">Najniższa cena z 30 dni przed obniżką: ' + money(showsSaving(id) ? regularUnit(id) : unitPrice(id, 1)) + '</div>';
      } else if (cp.note === 'bundle') {
        var q = qtyMap(), missing = cp.ids.filter(function (b) { return !q[b]; });
        html = '🎁 Kod ' + code + ' aktywny: ' + cp.label + '.';
        html += missing.length
          ? ' Rabat działa, gdy w koszyku są ' + (cp.ids.length === 2 ? 'oba produkty' : 'wszystkie produkty zestawu') + '.'
            + '<button type="button" class="btn btn-gold card-promo-add">Dodaj ' + (cp.ids.length === 2 ? 'oba' : 'wszystkie')
            + ' do koszyka — ' + money(cp.bundle) + '</button>'
          : ' Wszystkie produkty są już w koszyku.';
      } else if (cp.note === 'ladder') {
        html = 'ℹ️ Kod ' + code + ' jest aktywny, ale ta cena jest już niższa niż z kodem — rabaty się nie sumują, płacisz niższą.';
      } else {
        html = 'ℹ️ Kod ' + code + ' jest aktywny (' + cp.label + ') — na ten produkt nie daje rabatu.';
      }
      box.innerHTML = html;
      box.hidden = false;
      var btn = box.querySelector('.card-promo-add');
      if (btn) btn.addEventListener('click', function () {
        if (addOnce(cp.ids).length) notify(id, 1);
      });
    });
  }
  Cart.paintCards = paintCards;
  document.addEventListener('cart:change', paintCards);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintCards); else paintCards();

  /* Header counter badge — updates the "Koszyk" link on every page. */
  function renderBadge() {
    var n = Cart.count();
    var links = document.querySelectorAll('.header-actions a[href="koszyk.html"]');
    for (var i = 0; i < links.length; i++) {
      links[i].textContent = n > 0 ? 'Koszyk (' + n + ')' : 'Koszyk';
    }
  }

  /* Add-to-cart popup with actions (go to cart / continue shopping).
     2026-11-19 (owner: the familiar «go to cart / continue shopping» choice): a real modal — focus moves to «Przejdź do
     koszyka» and stays inside, Esc / × / a tap outside close it and give focus back — plus the cart's count and value,
     and a dataLayer event for every way out, so GA4 can show how many add and never open the cart:
       cart_prompt_view · cart_prompt_go · cart_prompt_continue {prompt_method: button | close | outside | esc}. */
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
    if (!popEl) {
      popEl = document.createElement('div');
      popEl.className = 'cart-pop';
      popEl.innerHTML =
        '<div class="cart-pop-box" role="dialog" aria-modal="true" aria-labelledby="cart-pop-title">' +
        '<button class="cart-pop-x" type="button" aria-label="Zamknij">&times;</button>' +
        '<div class="cart-pop-head"><span class="cart-pop-tick" aria-hidden="true">✓</span><span id="cart-pop-title">Dodano do koszyka</span></div>' +
        '<div class="cart-pop-prod"></div>' +
        '<div class="cart-pop-actions">' +
        '<a class="btn btn-gold cart-pop-go" href="koszyk.html">Przejdź do koszyka</a>' +
        '<button class="btn btn-ghost cart-pop-cont" type="button">Kontynuuj zakupy</button>' +
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
      thumb + '<div><strong>' + p.name + '</strong><div class="muted" style="font-size:13px">Ilość: ' + (qty || 1) + '</div>'
      + '<div class="cart-pop-sum">W koszyku: ' + n + ' szt. · ' + money(sum) + '</div></div>';
    if (!popEl.classList.contains('show')) popBack = document.activeElement;
    popEl.classList.add('show');
    dl({ event: 'cart_prompt_view' });
    try { popEl.querySelector('.cart-pop-go').focus({ preventScroll: true }); } catch (e) {}
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
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-x" aria-label="Zamknij">&times;</button><img alt="Opinia">';
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
  // Remembering what was viewed is a "functional" cookie: nothing is written before the
  // visitor accepts that category in the consent banner (cookies.js owns the decision and
  // clears the key when the category is withdrawn). Absent banner => treat as refused.
  function functionalOk() { return !!(window.CBconsent && window.CBconsent.allows('functional')); }
  function save(a) { if (!functionalOk()) return; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
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
    // Frequency: snooze after a dismissal (14 days) vs after the guide was taken
    // (a year — effectively "don't nag a subscriber again"). GUIDE_KEY is the shared
    // "already has the guide" flag, also set by the on-page guide form (forms.js).
    // The pop-up cannot run without its frequency cap (bolotov_exit_until), and that cap is a
    // "functional" cookie — so without that consent the pop-up simply does not appear. Showing
    // it uncapped would mean nagging on every single page view.
    if (!(window.CBconsent && window.CBconsent.allows('functional'))) return;
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
          + '<button class="exit-x" aria-label="Zamknij">&times;</button>'
          + '<h3 class="exit-h">Nie zgub swojego koszyka 🛒</h3>'
          + '<p class="exit-p">Twoje produkty czekają. Dokończ zamówienie teraz albo napisz do nas — pomożemy dobrać produkty i odpowiemy na pytania.</p>'
          + '<div class="exit-actions"><a class="btn btn-gold" href="koszyk.html">Wróć do koszyka</a>'
          + '<a class="btn btn-wa" href="' + WA + '">Napisz na WhatsApp</a></div></div>';
      } else {
        el.innerHTML = '<div class="exit-box exit-box-guide">'
          + '<button class="exit-x" aria-label="Zamknij">&times;</button>'
          + '<div class="exit-cover"><img src="assets/img/guide-cover-pl.webp" alt="Bezpłatny przewodnik po metodzie Bolotova"></div>'
          + '<div class="exit-body"><h3 class="exit-h">Zaczekaj — odbierz darmowy przewodnik</h3>'
          + '<p class="exit-p">Zostaw e-mail i od razu pobierz BEZPŁATNY przewodnik po systemie Bolotova — proste zasady odżywiania i stylu życia.</p>'
          + '<form class="exit-form" novalidate onsubmit="return false">'
          + '<input type="email" required placeholder="Twój e-mail *">'
          + '<label class="exit-consent"><input type="checkbox" name="marketing"><span>Chcę otrzymywać e-maile Centrum Bolotova z poradami i ofertami. Zgodę mogę w każdej chwili wycofać, klikając link w każdym e-mailu.</span></label>'
          + '<p class="exit-mini" style="margin:0">Dane przetwarzamy zgodnie z <a href="polityka-prywatnosci.html" style="color:inherit;text-decoration:underline">polityką prywatności</a>.</p>'
          + '<button class="btn btn-gold" type="submit">Odbierz przewodnik</button></form>'
          + '<p class="exit-mini">Bez spamu. W każdej chwili możesz zrezygnować.</p></div></div>';
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
        /* The mailing box is optional (2026-11-16, websites#29): the guide PDF is handed out right here either way,
           and only a ticked box adds the address to the guide mailing — the server records that consent on the deal. */
        if (badEmail) {
          var h = document.createElement('div'); h.className = 'cb-field-err';
          h.textContent = email ? 'Nieprawidłowy adres e-mail (np. jan@example.com).' : 'Podaj adres e-mail.';
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
          '<h3 class="exit-h">Dziękujemy! ✓</h3>'
          + '<p class="exit-p"><a class="btn btn-gold" href="https://drive.google.com/file/d/1sGEe2kURBFxBuGVd8IBJq0-cLNsp8OtX/view" target="_blank" rel="noopener">Pobierz przewodnik (PDF)</a></p>'
          + (mk ? '<p class="exit-p">Kolejne porady wyślemy Ci e-mailem.</p>' : '');
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
