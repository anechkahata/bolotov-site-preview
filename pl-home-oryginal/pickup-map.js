/* Paczkomat map for the cart (koszyk.html) — our own map, no carrier widget, no token.
 *
 * WHICH points: only the warehouse's own list (deliveryId 57), so a customer can never pick a point
 * the warehouse would refuse. WHERE they are: coordinates joined in at build time from InPost's
 * public API. Both are static files written by backend/tools/gen-pickup-map.php into pickup-map/:
 *   PL.json      every point as [code, lat, lng, kind, region] — loaded once, when the map opens
 *   PL-<n>.json  address / hours / hint of the points whose postcode starts with <n> — loaded only
 *                when the customer looks at that part of the country
 * The order is still validated server-side against src/pickup-points.PL.json, exactly as before:
 * the map only fills the same hidden #f-pickup-id the search does, through the cart's onChoose.
 *
 * Leaflet + markercluster come from cdn.jsdelivr.net (already allowed by the site's CSP). Since 2026-11-16 they and
 * PL.json are fetched only at the buyer's first action on the cart page (a tap, a scroll, a key, a focus in the
 * paczkomat box) while the paczkomat carrier is shown — not when the page opens: building the clusters cost a phone
 * ~2.7 s of CPU and took the cart's PageSpeed to 67. #pickup-map keeps its height (CSS in koszyk.html), so nothing
 * moves when the map arrives. «Pokaż najbliższe» waits for the map if it is still loading. Tiles: tile.openstreetmap.org, with the
 * attribution its tile policy requires. If any of it fails to load, the map hides itself and the
 * search above it keeps working — checkout never depends on the map.
 */
(function (w, d) {
  'use strict';

  var LEAFLET = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/';
  var CLUSTER = 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/';
  var DATA    = 'pickup-map/';
  var LIST_ZOOM = 12;   // below this the visible area holds hundreds of points — no list, just clusters
  var LIST_MAX  = 30;

  var map = null, cluster = null, points = null, byId = {}, details = {}, pending = {};
  var selected = null, onChoose = null, started = false, failed = false, armed = false, ready = null;
  var me = null, meMarker = null;   // the buyer's own position, once «Pokaż najbliższe» found it

  function loadCss(href) {
    var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = href; d.head.appendChild(l);
  }
  function loadJs(src) {
    return new Promise(function (ok, ko) {
      var s = d.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; d.head.appendChild(s);
    });
  }
  function getJson(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Region files: one per first postcode digit, fetched once and kept. */
  function region(n) {
    if (details[n]) return Promise.resolve(details[n]);
    if (!pending[n]) {
      pending[n] = getJson(DATA + 'PL-' + n + '.json').then(function (j) { details[n] = j.points || {}; return details[n]; });
    }
    return pending[n];
  }
  function withDetails(list) {
    var need = {};
    list.forEach(function (p) { need[p.r] = true; });
    return Promise.all(Object.keys(need).map(region)).then(function () { return list; });
  }
  /* The shape the cart's choosePickup() and pickupLabel() expect — same as /api/pickup-points. */
  function asPoint(p) {
    var x = (details[p.r] || {})[p.id] || [];
    return { id: p.id, name: '', street: x[0] || '', zip: x[1] || '', city: x[2] || '', hours: x[3] || '', hint: x[4] || '' };
  }
  function kindTag(p, pt) {
    if (p.k === 'b') return '<span class="pm-tag">Paczkomat' + (pt.hours ? '' : ' 24/7') + '</span>';
    return '<span class="pm-tag pm-tag-p">Punkt odbioru</span>';
  }
  function card(p) {
    var pt = asPoint(p);
    return '<b>' + esc(p.id) + '</b> ' + kindTag(p, pt)
      + '<br>' + esc([pt.street, (pt.zip + ' ' + pt.city).trim()].filter(Boolean).join(', '))
      + (pt.hint ? '<br><span class="pm-muted">' + esc(pt.hint) + '</span>' : '')
      + (pt.hours ? '<br><span class="pm-muted">Godziny: ' + esc(pt.hours) + '</span>' : '');
  }

  function icon(p, sel) {
    return L.divIcon({
      className: '',
      html: '<div class="pm-pin' + (p.k === 'p' ? ' pm-pin-p' : '') + (sel ? ' pm-pin-sel' : '') + '"></div>',
      iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -22]
    });
  }

  function choose(p, fromList) {
    withDetails([p]).then(function () {
      if (selected && selected !== p && selected.m) selected.m.setIcon(icon(selected, false));
      selected = p;
      p.m.setIcon(icon(p, true));
      var open = function () {
        p.m.bindPopup(card(p)).openPopup();
      };
      if (fromList) cluster.zoomToShowLayer(p.m, open); else open();
      if (onChoose) onChoose(asPoint(p));
      renderList();
    });
  }

  function renderList() {
    var box = d.getElementById('pickup-near');
    if (!box || !map) return;
    if (map.getZoom() < LIST_ZOOM) {
      box.innerHTML = '<p class="pm-hint">Przybliż mapę albo wpisz miasto powyżej, aby zobaczyć najbliższe punkty.</p>';
      return;
    }
    var c = map.getCenter(), b = map.getBounds();
    // measured from the buyer while they are on the map (after «Pokaż najbliższe»), else from its centre
    var mine = !!(me && b.contains(me)), ref = mine ? me : c;
    var near = points.filter(function (p) { return b.contains([p.lat, p.lng]); })
      .map(function (p) { return [map.distance(ref, [p.lat, p.lng]), p]; })
      .sort(function (a, z) { return a[0] - z[0]; })
      .slice(0, LIST_MAX);
    if (!near.length) {
      box.innerHTML = '<p class="pm-hint">Brak punktów w tym miejscu — przesuń mapę.</p>';
      return;
    }
    withDetails(near.map(function (x) { return x[1]; })).then(function () {
      box.innerHTML = near.map(function (x, i) {
        var dist = x[0] < 1000 ? Math.round(x[0]) + ' m' : (x[0] / 1000).toFixed(1).replace('.', ',') + ' km';
        var from = mine ? ' od Ciebie' : ' od środka mapy';
        return '<button type="button" class="pm-item' + (x[1] === selected ? ' pm-on' : '') + '" data-i="' + i + '">'
          + card(x[1]) + '<br><span class="pm-muted">' + dist + from + '</span></button>';
      }).join('');
      box.querySelectorAll('button[data-i]').forEach(function (btn) {
        btn.addEventListener('click', function () { choose(near[parseInt(btn.dataset.i, 10)][1], true); });
      });
    });
  }

  function hideMap() {
    failed = true;
    var m = d.getElementById('pickup-map'), n = d.getElementById('pickup-near');
    if (m) m.style.display = 'none';
    if (n) n.style.display = 'none';
  }

  /* Wait for the buyer's first action, then build the map once — and only if the paczkomat box is still shown. */
  var ACT = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'focusin'];
  function arm() {
    if (armed || started) return;
    armed = true;
    function go() {
      var box = d.getElementById('pickup-box');
      if (box && box.style.display === 'none') return;      // another carrier is chosen — keep waiting
      ACT.forEach(function (e) { w.removeEventListener(e, go, true); });
      armed = false;
      if (!started && !failed) start();
    }
    ACT.forEach(function (e) { w.addEventListener(e, go, { capture: true, passive: true }); });
  }

  function start() {
    started = true;
    loadCss(LEAFLET + 'leaflet.css');
    loadCss(CLUSTER + 'MarkerCluster.css');
    loadCss(CLUSTER + 'MarkerCluster.Default.css');
    ready = Promise.all([
      loadJs(LEAFLET + 'leaflet.js').then(function () { return loadJs(CLUSTER + 'leaflet.markercluster.js'); }),
      getJson(DATA + 'PL.json')
    ]).then(function (res) {
      var idx = res[1];
      points = (idx.rows || []).map(function (r) {
        var p = { id: r[0], lat: r[1], lng: r[2], k: r[3], r: r[4] };
        byId[p.id] = p;
        return p;
      });
      map = L.map('pickup-map', { zoomControl: true, preferCanvas: true })
        .fitBounds([[49.0, 14.1], [54.9, 24.2]]);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
      }).addTo(map);
      cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50, chunkedLoading: true });
      points.forEach(function (p) {
        p.m = L.marker([p.lat, p.lng], { icon: icon(p, false) });
        p.m.on('click', function () { choose(p, false); });
        cluster.addLayer(p.m);
      });
      map.addLayer(cluster);
      map.on('moveend', renderList);
      renderList();
    }).catch(hideMap);
    return ready;
  }

  w.CBPickupMap = {
    /* Called when the paczkomat carrier is shown. Safe to call again: it only resizes. */
    open: function (opts) {
      if (opts && opts.onChoose) onChoose = opts.onChoose;
      if (failed) return;
      if (!started) { arm(); return; }
      if (map) setTimeout(function () { map.invalidateSize(); renderList(); }, 0);
    },
    /* The search list answered: show those points on the map. */
    focus: function (ids) {
      if (!map || !ids || !ids.length) return;
      var ll = ids.map(function (id) { return byId[id]; }).filter(Boolean).map(function (p) { return [p.lat, p.lng]; });
      if (ll.length) map.fitBounds(L.latLngBounds(ll).pad(0.15), { maxZoom: 15 });
    },
    /* «Pokaż najbliższe» (2026-10-29): centre the map on the buyer's own position, so the list under it is
       the nearest points. The position never leaves the browser — it only moves the map. `done(ok)` lets
       the cart say something when the browser refuses or the map is not there. */
    locate: function (done) {
      done = done || function () {};
      var self = this;
      if (!failed && !map && navigator.geolocation) {           // the map is not built yet: build it, then locate
        (started ? ready : start()).then(function () { if (map) self.locate(done); else done(false); }, function () { done(false); });
        return;
      }
      if (failed || !map || !navigator.geolocation) { done(false); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        me = L.latLng(pos.coords.latitude, pos.coords.longitude);
        if (meMarker) meMarker.setLatLng(me);
        else meMarker = L.circleMarker(me, { radius: 8, color: '#fff', weight: 3, fillColor: '#2a7de1', fillOpacity: 1 }).addTo(map);
        // the buyer and their five nearest points in view — a town may have none within a street or two
        var five = points.map(function (p) { return [me.distanceTo([p.lat, p.lng]), p]; })
          .sort(function (a, z) { return a[0] - z[0]; }).slice(0, 5)
          .map(function (x) { return [x[1].lat, x[1].lng]; });
        map.fitBounds(L.latLngBounds(five.concat([[me.lat, me.lng]])).pad(0.2), { maxZoom: 16 });
        if (map.getZoom() < LIST_ZOOM) map.setView(me, LIST_ZOOM);
        done(true);
      }, function () { done(false); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    },
    /* The customer chose a point in the search list: mark it on the map too (no callback). */
    show: function (id) {
      var p = byId[id];
      if (!map || !p) return;
      if (selected && selected !== p && selected.m) selected.m.setIcon(icon(selected, false));
      selected = p;
      p.m.setIcon(icon(p, true));
      withDetails([p]).then(function () {
        cluster.zoomToShowLayer(p.m, function () { p.m.bindPopup(card(p)).openPopup(); });
        renderList();
      });
    },
    /* The carrier changed or the choice was cleared. */
    clear: function () {
      if (selected && selected.m) selected.m.setIcon(icon(selected, false));
      selected = null;
      if (map) { map.closePopup(); renderList(); }
    }
  };
})(window, document);
