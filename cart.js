/* Centrum Bolotova — client-side cart (localStorage).
   Handles add/update/remove, Balzam 500 ml quantity tiers, header counter badge,
   and an add-to-cart toast. Stripe charging is wired separately (needs keys). */
(function () {
  var CATALOG = {
    'balzam-250':            { name: 'Balzam Bolotova 250 ml', price: 141, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html' },
    'balzam-500':            { name: 'Balzam Bolotova 500 ml', price: 193, img: 'assets/img/prod-balzam.jpg', url: 'produkt-balzam.html',
                               tiers: [{ min: 6, price: 153 }, { min: 3, price: 163 }, { min: 1, price: 193 }] },
    'kolagen':               { name: 'Kolagen by Bolotov', price: 279, img: 'assets/img/prod-kolagen.png', url: 'kolagen-by-bolotov.html' },
    'l-glutamine':           { name: 'L-Glutamine Gastric Restore Complex', price: 116, img: 'assets/img/prod-lglutamine.png', url: 'l-glutamine.html' },
    'hyaluronic':            { name: 'Hyaluronic Acid + Vitamin C', price: 116, img: 'assets/img/prod-hyaluronic.png', url: 'hyaluronic-acid-vitamin-c.html' },
    'biotin':                { name: 'Biotin Zinc Selenium', price: 71, img: 'assets/img/prod-biotin.png', url: 'biotin-zinc-selenium.html' },
    'set-beauty-base':       { name: 'Set Beauty Base System', price: 326, url: 'set-beauty-base.html' },
    'set-refluks-zgaga':     { name: 'Set Program na Refluks i Zgagę', price: 281, url: 'set-refluks-zgaga.html' },
    'set-ciezkosc-wzdecia':  { name: 'Set Program na Uczucie Ciężkości i Wzdęcia', price: 209, url: 'set-ciezkosc-wzdecia.html' },
    'set-trawienie-stawy':   { name: 'Set Trawienie & Stawy', price: 409, url: 'set-trawienie-stawy.html' },
    'set-kuracja-kolagenowa':{ name: 'Set Intensywna Kuracja Kolagenowa', price: 687, url: 'set-kuracja-kolagenowa.html' },
    'set-restart':           { name: 'Set Bolotov Restart Program', price: 856, url: 'set-restart.html' }
  };

  var KEY = 'bolotov_cart_v1';

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

  var Cart = {
    CATALOG: CATALOG,
    items: read,
    unitPrice: unitPrice,
    add: function (id, qty) {
      if (!CATALOG[id]) { return; }
      qty = qty || 1;
      var items = read();
      var row = items.filter(function (i) { return i.id === id; })[0];
      if (row) { row.qty += qty; } else { items.push({ id: id, qty: qty }); }
      write(items);
      toast(CATALOG[id].name + ' — dodano do koszyka');
    },
    setQty: function (id, qty) {
      var items = read().map(function (i) { return i.id === id ? { id: id, qty: qty } : i; })
                        .filter(function (i) { return i.qty > 0; });
      write(items);
    },
    remove: function (id) {
      write(read().filter(function (i) { return i.id !== id; }));
    },
    clear: function () { write([]); },
    count: function () { return read().reduce(function (s, i) { return s + i.qty; }, 0); },
    subtotal: function () {
      return read().reduce(function (s, i) { return s + unitPrice(i.id, i.qty) * i.qty; }, 0);
    }
  };
  window.Cart = Cart;

  /* Header counter badge — updates the "Koszyk" link on every page. */
  function renderBadge() {
    var n = Cart.count();
    var links = document.querySelectorAll('.header-actions a[href="koszyk.html"]');
    for (var i = 0; i < links.length; i++) {
      links[i].textContent = n > 0 ? 'Koszyk (' + n + ')' : 'Koszyk';
    }
  }

  /* Lightweight toast. */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cart-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBadge);
  } else {
    renderBadge();
  }
})();
