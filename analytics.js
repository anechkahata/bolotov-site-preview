/* Centrum Bolotova — dataLayer event tracking for GTM (GA4 e-commerce schema).
   Engagement + lead + funnel events. The cart pushes (add/remove/promo) live in cart.js;
   begin_checkout is in koszyk.html and purchase in dziekujemy.html (they own the order data).
   Consent is enforced by Consent Mode (see <head> + cookies.js): these pushes are harmless
   before consent because GA/Pixel tags don't fire until analytics_storage is granted. */
(function () {
  function dl(o) { try { (window.dataLayer = window.dataLayer || []).push(o); } catch (e) {} }
  function page() { return (location.pathname.split('/').pop() || 'index.html'); }
  function ecomItem(id, qty) {
    if (!window.Cart || !Cart.CATALOG[id]) return null;
    var p = Cart.CATALOG[id];
    return { item_id: id, item_name: p.name, price: Cart.unitPrice(id, qty || 1), quantity: qty || 1 };
  }
  window.CBtrack = { dl: dl, ecomItem: ecomItem };

  /* view_item — a page declares its product via <body data-recent="<catalog-id>">. */
  function viewItem() {
    var id = document.body.getAttribute('data-recent');
    if (!id || !window.Cart || !Cart.CATALOG[id]) return;
    var p = Cart.CATALOG[id];
    dl({ ecommerce: null });
    dl({ event: 'view_item', ecommerce: { currency: 'PLN', value: p.price, items: [ecomItem(id, 1)] } });
  }

  /* Delegated clicks (capture phase, so it runs before the gallery/lightbox handlers). */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var wa = t.closest('a[href*="wa.me"], a[href*="api.whatsapp"]');
    if (wa) { dl({ event: 'whatsapp_click', link_url: wa.href, page: page() }); return; }

    var tab = t.closest('[data-tab]');
    if (tab) { dl({ event: 'tab_switch', tab_name: tab.getAttribute('data-tab'), page: page() }); return; }

    var isImg = t.id === 'gmain' || (t.tagName === 'IMG' && t.closest('.gthumbs, .rev-track, .reviews-grid'));
    if (isImg) { dl({ event: 'image_zoom', image_src: (t.currentSrc || t.src || '').split('/').pop(), page: page() }); return; }

    var cta = t.closest('a.btn');
    if (cta) { dl({ event: 'cta_click', cta_text: (cta.textContent || '').trim().slice(0, 60), destination: cta.getAttribute('href') || '', page: page() }); return; }
  }, true);

  /* Lead forms — every form submit except the promo box and the checkout form
     (those are select_promotion / begin_checkout, handled where the data lives). */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.id === 'promo-form' || f.id === 'order-form') return;
    dl({ event: 'generate_lead', form_name: f.getAttribute('data-form') || f.id || 'lead', page: page() });
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', viewItem); else viewItem();
})();
