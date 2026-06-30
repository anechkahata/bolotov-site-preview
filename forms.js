/* forms.js — wires the website lead-magnet + review forms to the PHP backend.
 *
 *   data-cb-form="lead"   → POST /api/lead   (guide download; source defaults to
 *                           "guide", override with data-cb-source="exit-intent")
 *   data-cb-form="review" → POST /api/review (customer opinion → shop inbox)
 *
 * Direct fetch POST (no amoCRM iframe) so it works inside the Instagram / Facebook
 * in-app browsers. Reads inputs by type (email / tel / textarea) — the forms have
 * no name attributes. A hidden honeypot is injected to catch scraper bots.
 *
 * Degrades gracefully: the backend always answers ok, and on a network error
 * (e.g. the static GitHub-Pages preview where PHP doesn't run) we still show the
 * thank-you so the visitor's experience isn't broken. The exit-intent popup form
 * (built dynamically in cart.js) calls window.CBpostForm directly.
 */
(function () {
  'use strict';

  /* Always-resolving POST helper. Returns the parsed JSON, or {ok:false} on error. */
  window.CBpostForm = function (path, payload) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .catch(function () { return { ok: false, offline: true }; });
  };

  function track(event, extra) {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: event }, extra || {})); } catch (e) {}
  }

  function honeypot(form) {
    var hp = form.querySelector('input[name="company_website"]');
    if (!hp) {
      hp = document.createElement('input');
      hp.type = 'text'; hp.name = 'company_website'; hp.tabIndex = -1;
      hp.autocomplete = 'off';
      hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
      hp.setAttribute('aria-hidden', 'true');
      form.appendChild(hp);
    }
    return hp;
  }

  function val(form, selector) {
    var el = form.querySelector(selector);
    return el ? String(el.value || '').trim() : '';
  }

  /* Replace the form with an inline thank-you message. */
  function thankYou(form, title, text) {
    var box = document.createElement('div');
    box.className = 'form-thanks';
    box.style.cssText = 'padding:18px 4px';
    box.innerHTML = '<h3 style="margin:0 0 6px">' + title + '</h3><p style="margin:0">' + text + '</p>';
    form.parentNode.replaceChild(box, form);
  }

  function wireLead(form) {
    var hp = honeypot(form);
    var source = form.getAttribute('data-cb-source') || 'guide';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      if (hp.value) return; // bot
      var payload = {
        email: val(form, 'input[type="email"]'),
        phone: val(form, 'input[type="tel"]'),
        name: val(form, 'input[type="text"]:not([name="company_website"])'),
        source: source
      };
      var btn = form.querySelector('button, input[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      track('generate_lead', { lead_source: source });
      window.CBpostForm('/api/lead', payload).then(function () {
        thankYou(form, 'Dziękujemy! ✓', 'Sprawdź skrzynkę — przewodnik jest w drodze.');
      });
    });
  }

  function wireReview(form) {
    var hp = honeypot(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      if (hp.value) return;
      var payload = {
        name: val(form, 'input[type="text"]:not([name="company_website"]), input:not([type])'),
        email: val(form, 'input[type="email"]'),
        text: val(form, 'textarea')
      };
      var btn = form.querySelector('button, input[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      track('submit_review', {});
      window.CBpostForm('/api/review', payload).then(function () {
        thankYou(form, 'Dziękujemy za opinię! ✓', 'Po moderacji pojawi się na stronie.');
      });
    });
  }

  function start() {
    var leads = document.querySelectorAll('form[data-cb-form="lead"]');
    for (var i = 0; i < leads.length; i++) wireLead(leads[i]);
    var revs = document.querySelectorAll('form[data-cb-form="review"]');
    for (var j = 0; j < revs.length; j++) wireReview(revs[j]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
