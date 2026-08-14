/* forms.js — wires the website lead-magnet + review forms to the PHP backend.
 *
 *   data-cb-form="lead"    → POST /api/lead    (guide download; source defaults to
 *                            "guide", override with data-cb-source="exit-intent")
 *   data-cb-form="review"  → POST /api/review  (customer opinion → shop inbox)
 *   data-cb-form="inquiry" → POST /api/inquiry (partner / doctor enquiry → shop inbox;
 *                            source from data-cb-source: "partner" | "doctor")
 *
 * Every tel field inside a data-cb-form form is upgraded to intl-tel-input (country
 * selector + E.164 normalisation), the same widget the kosik checkout uses; the
 * submitted phone is the E.164 number when the widget loaded, else the raw value.
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

  /* ── Validation ──────────────────────────────────────────────────────────────
   * Custom, so messages are Polish (native browser bubbles are in the device's
   * locale — Russian phones showed Russian) and phone content is actually checked
   * (type="tel" accepts anything). Same rules as the kosik checkout. Each wired
   * form gets `novalidate` so the browser's own validation never pre-empts this. */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MSG = {
    req:        'Vyplňte toto pole.',
    emailEmpty: 'Zadejte e-mailovou adresu.',
    emailBad:   'Neplatná e-mailová adresa (např. jan@example.com).',
    phoneEmpty: 'Podaj numer telefonu.',
    phoneBad:   'Neplatné telefonní číslo pro vybranou zemi.',
    consent:    'Zaškrtněte souhlas, abyste mohli pokračovat.'
  };

  /* Phone valid only when intl-tel-input utils loaded; else a loose ≥8-digit check. */
  function phoneValid(el) {
    try {
      if (el._iti && window.intlTelInputUtils && typeof el._iti.isValidNumber === 'function') {
        var r = el._iti.isValidNumber(); if (r === true) return true; if (r === false) return false;
      }
    } catch (e) {}
    return String(el.value || '').replace(/\D/g, '').length >= 8;
  }

  function clearErrors(form) {
    var q = function (s) { return form.querySelectorAll(s); };
    [].forEach.call(q('.cb-invalid'), function (el) { el.classList.remove('cb-invalid'); });
    [].forEach.call(q('.cb-consent-invalid'), function (el) { el.classList.remove('cb-consent-invalid'); });
    [].forEach.call(q('.cb-field-err'), function (el) { el.remove(); });
  }

  function showError(el, msg) {
    var hint = document.createElement('div');
    hint.className = 'cb-field-err';
    hint.textContent = msg;
    if (el.type === 'checkbox') {
      var lab = el.closest('label') || el;
      lab.classList.add('cb-consent-invalid');
      lab.parentNode.insertBefore(hint, lab.nextSibling);
    } else {
      el.classList.add('cb-invalid');
      el.parentNode.insertBefore(hint, el.nextSibling);
    }
  }

  /* Validate every field by type; returns [{el,msg}]. Honeypot + optional empties skipped. */
  function validate(form) {
    var errs = [], fields = form.querySelectorAll('input, textarea, select');
    for (var i = 0; i < fields.length; i++) {
      var el = fields[i];
      if (el.name === 'company_website' || el.type === 'hidden') continue;
      var req = el.hasAttribute('required'), v = String(el.value || '').trim();
      if (el.type === 'checkbox') { if (req && !el.checked) errs.push({ el: el, msg: MSG.consent }); continue; }
      if (el.type === 'email') {
        if (!v) { if (req) errs.push({ el: el, msg: MSG.emailEmpty }); }
        else if (!EMAIL_RE.test(v)) errs.push({ el: el, msg: MSG.emailBad });
        continue;
      }
      if (el.type === 'tel') {
        if (!v) { if (req) errs.push({ el: el, msg: MSG.phoneEmpty }); }
        else if (!phoneValid(el)) errs.push({ el: el, msg: MSG.phoneBad });
        continue;
      }
      if (req && !v) errs.push({ el: el, msg: MSG.req });
    }
    return errs;
  }

  /* Paint errors + focus the first bad field. Returns true when the form is clean. */
  function passes(form) {
    clearErrors(form);
    var errs = validate(form);
    if (!errs.length) return true;
    errs.forEach(function (p) { showError(p.el, p.msg); });
    var f = errs[0].el;
    try { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { if (f.scrollIntoView) f.scrollIntoView(); }
    setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { if (f.focus) f.focus(); } }, 200);
    return false;
  }

  /* Prepare a form for custom validation: disable native bubbles + clear-on-edit. */
  function prepValidation(form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('cb-invalid')) {
        t.classList.remove('cb-invalid');
        var h = t.nextSibling; if (h && h.className === 'cb-field-err') h.remove();
      }
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.type === 'checkbox' && t.checked) {
        var lab = t.closest('label'); if (lab) { lab.classList.remove('cb-consent-invalid'); var h = lab.nextSibling; if (h && h.className === 'cb-field-err') h.remove(); }
      }
    });
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

  /* ── Phone input: intl-tel-input (country selector + E.164), same as kosik ── */
  // Restrict the country list to our sales markets (VAT canon: PL/CZ/SK/DE/AT/IT/SI) + the main
  // Polish/Ukrainian diaspora (UA/GB/IE/NL/BE). Owner decision 2026-07-23 — not every country.
  var ITI_ONLY = ['cz','sk','pl','ua','de','at','it','si','gb','ie','nl','be'];
  var ITI_OPTS = {
    initialCountry: 'cz',
    onlyCountries: ITI_ONLY,
    preferredCountries: ['cz','sk','ua','pl','de'],
    separateDialCode: true,
    autoPlaceholder: 'aggressive',
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js'
  };
  var ITI_CDN = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/';
  var itiLoading = false, itiQueue = [];

  /* Load the intl-tel-input CSS+JS once (CDN, no CSP on this site), then run every
   * queued callback. Fails soft: if the CDN is blocked the field stays a plain tel. */
  function loadITI(cb) {
    if (window.intlTelInput) { cb(); return; }
    itiQueue.push(cb);
    if (itiLoading) return;
    itiLoading = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = ITI_CDN + 'css/intlTelInput.css';
    document.head.appendChild(link);
    var st = document.createElement('style');
    st.textContent = '.iti{width:100%;display:block}.iti input{width:100%}';
    document.head.appendChild(st);
    var s = document.createElement('script');
    s.src = ITI_CDN + 'js/intlTelInput.min.js';
    s.onload = function () { for (var i = 0; i < itiQueue.length; i++) itiQueue[i](); itiQueue = []; };
    document.head.appendChild(s);
  }

  function initPhone(el) {
    if (!el || el._iti || !window.intlTelInput) return;
    try { el._iti = window.intlTelInput(el, ITI_OPTS); } catch (e) {}
  }

  /* E.164 number via intl-tel-input if it initialised, else the raw typed value. */
  function telNumber(el) {
    if (!el) return '';
    var raw = String(el.value || '').trim();
    try { if (el._iti && window.intlTelInputUtils) { var n = el._iti.getNumber(); if (n) return n; } } catch (e) {}
    return raw;
  }

  function val(form, selector) {
    var el = form.querySelector(selector);
    return el ? String(el.value || '').trim() : '';
  }

  /* Replace the form with an inline thank-you message. */
  function thankYou(form, title, text) {
    var box = document.createElement('div');
    box.className = 'form-thanks';
    box.innerHTML = '<h3>' + title + '</h3><p>' + text + '</p>';
    form.parentNode.replaceChild(box, form);
  }

  function wireLead(form) {
    var hp = honeypot(form);
    prepValidation(form);
    var source = form.getAttribute('data-cb-source') || 'guide';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (hp.value) return; // bot
      if (!passes(form)) return;
      var payload = {
        email: val(form, 'input[type="email"]'),
        phone: telNumber(form.querySelector('input[type="tel"]')),
        name: val(form, 'input[type="text"]:not([name="company_website"])'),
        source: source
      };
      var btn = form.querySelector('button, input[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      track('generate_lead', { lead_source: source });
      // Mark the guide as taken so the exit-intent popup (cart.js) stops nagging.
      try { localStorage.setItem('bolotov_guide', '1'); } catch (e) {}
      window.CBpostForm('/api/lead', payload).then(function () {
        thankYou(form, 'Děkujeme! ✓', 'Zkontrolujte schránku — průvodce je na cestě.');
      });
    });
  }

  function wireReview(form) {
    var hp = honeypot(form);
    prepValidation(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (hp.value) return;
      if (!passes(form)) return;
      var payload = {
        name: val(form, 'input[type="text"]:not([name="company_website"]), input:not([type])'),
        email: val(form, 'input[type="email"]'),
        text: val(form, 'textarea')
      };
      var btn = form.querySelector('button, input[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      track('submit_review', {});
      window.CBpostForm('/api/review', payload).then(function () {
        thankYou(form, 'Děkujeme za hodnocení! ✓', 'Po schválení se objeví na stránce.');
      });
    });
  }

  /* Partner / doctor enquiry: e-mailed to the shop inbox (no CRM, no mailing list).
   * Collects every named input by its name so each form can carry its own fields. */
  function wireInquiry(form) {
    var hp = honeypot(form);
    prepValidation(form);
    var source = form.getAttribute('data-cb-source') || 'partner';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (hp.value) return; // bot
      if (!passes(form)) return;
      var payload = { source: source };
      var fields = form.querySelectorAll('input[name], textarea[name], select[name]');
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.name === 'company_website' || f.type === 'checkbox') continue;
        payload[f.name] = f.type === 'tel' ? telNumber(f) : String(f.value || '').trim();
      }
      var btn = form.querySelector('button, input[type="submit"]');
      if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
      track('generate_lead', { lead_source: source });
      window.CBpostForm('/api/inquiry', payload).then(function () {
        thankYou(form, 'Děkujeme! ✓', 'Přijali jsme vaši žádost — brzy se ozveme.');
      });
    });
  }

  function start() {
    var leads = document.querySelectorAll('form[data-cb-form="lead"]');
    for (var i = 0; i < leads.length; i++) wireLead(leads[i]);
    var revs = document.querySelectorAll('form[data-cb-form="review"]');
    for (var j = 0; j < revs.length; j++) wireReview(revs[j]);
    var inqs = document.querySelectorAll('form[data-cb-form="inquiry"]');
    for (var k = 0; k < inqs.length; k++) wireInquiry(inqs[k]);
    // Upgrade every enquiry/lead phone field to intl-tel-input (country + E.164).
    var tels = document.querySelectorAll('form[data-cb-form] input[type="tel"]');
    if (tels.length) loadITI(function () {
      for (var t = 0; t < tels.length; t++) initPhone(tels[t]);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
