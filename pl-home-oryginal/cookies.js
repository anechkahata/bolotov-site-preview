/* Centrum Bolotova — custom cookie consent banner (RODO/ePrivacy). No third-party tools.

   Four categories, as the Polish canon requires (GDPR research, section 6.4):
     necessary   — always on, cannot be switched off (cart, promo code, this very choice);
     functional  — remembers preferences (recently viewed products, the guide pop-up);
     analytics   — Google Analytics;
     marketing   — advertising / remarketing.

   Consent Mode v2: the defaults ('denied' for everything but security_storage) are pushed
   inline in <head>, which also restores a stored choice before GTM loads. That inline copy
   mirrors parse() + signals() below; the two MUST be changed together.

   Storage: localStorage['cb-consent'] holds JSON {v:2,functional,analytics,marketing,ts}.
   The two-button banner that shipped before this one wrote plain 'all' / 'essential', and
   those values are still sitting in visitors' browsers — they keep working and are never
   re-prompted: 'all' = every category on, 'essential' = every category off.

   Any element with class "cookie-settings" (the footer link) re-opens the banner with the
   category panel already unfolded. */
(function(){
  var KEY='cb-consent';

  /* Category register: id, label, description. 'necessary' is listed for the panel only —
     it is never stored and never switchable. */
  var CATS=[
    ['necessary','Niezbędne','Konieczne do działania sklepu — koszyk, kod rabatowy i zapamiętanie Twojego wyboru dotyczącego cookies. Bez nich sklep nie działa, dlatego nie można ich wyłączyć.'],
    ['functional','Funkcjonalne','Zapamiętują Twoje preferencje — m.in. ostatnio oglądane produkty oraz to, czy pokazaliśmy Ci już okno z bezpłatnym przewodnikiem.'],
    ['analytics','Analityczne','Pozwalają liczyć odwiedziny i rozumieć, jak korzystasz ze strony, żebyśmy mogli ją ulepszać (Google Analytics).'],
    ['marketing','Marketingowe','Pozwalają dopasować reklamy do Twoich zainteresowań i mierzyć ich skuteczność.']
  ];

  /* Storage written on behalf of a category. Kept here, next to the consent code, so the
     register matches the table in polityka-cookies.html; withdrawing a category removes it. */
  var GATED={ functional:['bolotov_recent_v1','bolotov_exit_until','bolotov_guide'] };

  var ALL={functional:true,analytics:true,marketing:true};
  var NONE={functional:false,analytics:false,marketing:false};

  function raw(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function save(c){
    try{localStorage.setItem(KEY,JSON.stringify({v:2,functional:c.functional,analytics:c.analytics,marketing:c.marketing,ts:Date.now()}));}catch(e){}
  }
  /* Whatever is in storage -> {functional,analytics,marketing}, or null when there is no
     valid choice yet (first visit, or a corrupted value — both mean "ask again"). */
  function parse(s){
    if(!s) return null;
    if(s==='all') return {functional:true,analytics:true,marketing:true};
    if(s==='essential') return {functional:false,analytics:false,marketing:false};
    try{
      var o=JSON.parse(s);
      if(!o||typeof o!=='object') return null;
      return {functional:!!o.functional,analytics:!!o.analytics,marketing:!!o.marketing};
    }catch(e){return null;}
  }
  function current(){return parse(raw());}

  function signals(c){
    var m=c.marketing?'granted':'denied', a=c.analytics?'granted':'denied', f=c.functional?'granted':'denied';
    return {ad_storage:m,ad_user_data:m,ad_personalization:m,analytics_storage:a,
            functionality_storage:f,personalization_storage:f};
  }
  function gtag(){(window.dataLayer=window.dataLayer||[]).push(arguments);}

  function purge(c){
    for(var cat in GATED){
      if(!GATED.hasOwnProperty(cat)||c[cat]) continue;
      for(var i=0;i<GATED[cat].length;i++){try{localStorage.removeItem(GATED[cat][i]);}catch(e){}}
    }
  }

  /* The Consent Mode update goes out BEFORE the cookie_consent_* event — GTM triggers are
     wired to that order. The event names are unchanged; the per-category flags are extra. */
  function apply(c){
    gtag('consent','update',signals(c));
    var any=c.functional||c.analytics||c.marketing;
    (window.dataLayer=window.dataLayer||[]).push({
      event:any?'cookie_consent_granted':'cookie_consent_denied',
      cookie_consent_functional:c.functional,
      cookie_consent_analytics:c.analytics,
      cookie_consent_marketing:c.marketing
    });
    purge(c);
    try{document.dispatchEvent(new CustomEvent('cb:consent',{detail:c}));}catch(e){}
  }

  function injectCss(){
    if(document.getElementById('cb-style')) return;
    /* White and plain (owner, 2026-11-01): the wine bar melted into the wine page sections and she
       could hardly find it. A dark top rule and a shadow lift it off any page. */
    var css='#cb-banner{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#fff;color:#2b2226;'
      +'font-family:"Open Sans",system-ui,sans-serif;font-size:14px;padding:16px 20px;border-top:3px solid #5E2039;'
      +'box-shadow:0 -8px 28px rgba(0,0,0,.28);'
      +'max-height:92vh;overflow:auto}'
      +'#cb-banner .cb-in{max-width:1140px;margin:0 auto;display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:space-between}'
      +'#cb-banner a{color:#5E2039;text-decoration:underline}'
      +'#cb-banner .cb-btns{display:flex;gap:10px;flex-wrap:wrap}'
      +'#cb-banner button{font-family:"Montserrat",sans-serif;font-weight:700;font-size:13px;border-radius:8px;'
      +'padding:11px 20px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px}'
      +'#cb-banner .cb-all,#cb-banner .cb-save{background:#5E2039;color:#fff;border:2px solid #5E2039}'
      +'#cb-banner .cb-ess{background:#fff;color:#5E2039;border:2px solid #5E2039}'
      +'#cb-banner .cb-set{background:transparent;color:#5E2039;border:1px solid #c9b3bd}'
      +'#cb-panel{max-width:1140px;margin:14px auto 0;padding-top:14px;border-top:1px solid #ecdfe4;'
      +'display:grid;gap:12px}'
      +'#cb-panel[hidden]{display:none}'
      +'#cb-banner .cb-cat{display:flex;gap:10px;align-items:flex-start;line-height:1.45;cursor:pointer}'
      +'#cb-banner .cb-cat input{margin-top:3px;width:16px;height:16px;flex:0 0 auto;accent-color:#5E2039}'
      +'#cb-banner .cb-cat input:disabled{opacity:.6;cursor:not-allowed}'
      +'#cb-banner .cb-cat strong{font-family:"Montserrat",sans-serif}'
      +'#cb-banner .cb-cat em{font-style:normal;opacity:.75}'
      +'#cb-banner .cb-foot{display:flex;justify-content:flex-end}'
      /* Phones (owner 2026-11-19, «первый экран куки везде сделать меньше»): one slim bar — two short lines of text with
         «Ustawienia» as a link inside them, then «Tylko niezbędne» and «Akceptuj wszystkie» side by side, equal in size
         (RODO: refusing is as easy as accepting). ~80 px at 375 px instead of 195. */
      +'@media (max-width:640px){'
      +'#cb-banner{font-size:12px;line-height:1.35;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));border-top-width:2px}'
      +'#cb-banner .cb-in{gap:7px}'
      +'#cb-banner .cb-in>span:first-child{flex:1 1 100%}'
      +'#cb-banner .cb-btns{flex:1 1 100%;gap:8px;flex-wrap:nowrap}'
      +'#cb-banner .cb-ess,#cb-banner .cb-all{flex:1 1 0;padding:8px 6px;font-size:11.5px;letter-spacing:.2px}'
      +'#cb-banner .cb-link{background:none;border:0;padding:0;font:inherit;color:#5E2039;text-decoration:underline;'
      +'text-transform:none;letter-spacing:0;cursor:pointer}'
      +'#cb-panel{margin-top:8px;padding-top:8px;gap:8px}}';
    var s=document.createElement('style'); s.id='cb-style'; s.textContent=css; document.head.appendChild(s);
  }

  function rows(c){
    var out='';
    for(var i=0;i<CATS.length;i++){
      var k=CATS[i][0], nec=(k==='necessary'), on=nec||!!c[k];
      out+='<label class="cb-cat"><input type="checkbox" data-cat="'+k+'"'+(on?' checked':'')+(nec?' disabled':'')+'>'
        +'<span><strong>'+CATS[i][1]+'</strong>'+(nec?' <em>— zawsze aktywne</em>':'')+'<br>'+CATS[i][2]+'</span></label>';
    }
    return out;
  }

  function showBanner(openPanel){
    if(document.getElementById('cb-banner')) return;   // already visible
    injectCss();
    var c=current()||NONE;
    var b=document.createElement('div');
    b.id='cb-banner';
    b.setAttribute('role','dialog');
    b.setAttribute('aria-label','Ustawienia plików cookie');
    /* Phones (≤ 640 px, owner 2026-10-29, as on the CZ/SK shop): two lines instead of five, so the bar does not
       hide the order button; the cookie page it links to names every tool and links the privacy policy. */
    var short=window.matchMedia && window.matchMedia('(max-width:640px)').matches;
    var setHtml='<button type="button" class="'+(short?'cb-link':'cb-set')+'" id="cb-set" aria-expanded="false" aria-controls="cb-panel">Ustawienia</button>';
    var text=short
      ? 'Cookies do statystyk i reklam — tylko za zgodą. <a href="polityka-cookies.html">Więcej</a> · '+setHtml
      : 'Używamy plików cookie, aby zapewnić prawidłowe działanie strony oraz — za Twoją zgodą — zapamiętywać Twoje preferencje, analizować ruch i prowadzić działania marketingowe. Zgodę możesz w każdej chwili zmienić lub wycofać. Szczegóły w <a href="polityka-prywatnosci.html">Polityce prywatności</a> i <a href="polityka-cookies.html">Polityce plików cookies</a>.';
    b.innerHTML='<div class="cb-in"><span>'+text+'</span>'
      +'<span class="cb-btns">'+(short?'':setHtml)
      +'<button type="button" class="cb-ess" id="cb-ess">Tylko niezbędne</button>'
      +'<button type="button" class="cb-all" id="cb-all">Akceptuj wszystkie</button></span></div>'
      +'<div id="cb-panel" hidden>'+rows(c)
      +'<div class="cb-foot"><button type="button" class="cb-save" id="cb-save">Zapisz wybór</button></div></div>';
    document.body.appendChild(b);

    var panel=b.querySelector('#cb-panel'), setBtn=b.querySelector('#cb-set');
    function choose(x){ save(x); apply(x); b.remove(); }
    function toggle(){ var open=panel.hidden; panel.hidden=!open; setBtn.setAttribute('aria-expanded',open?'true':'false'); }

    setBtn.onclick=toggle;
    b.querySelector('#cb-all').onclick=function(){choose(ALL);};
    b.querySelector('#cb-ess').onclick=function(){choose(NONE);};
    b.querySelector('#cb-save').onclick=function(){
      var out={functional:false,analytics:false,marketing:false},
          ins=panel.querySelectorAll('input[data-cat]');
      for(var i=0;i<ins.length;i++){
        var k=ins[i].getAttribute('data-cat');
        if(k!=='necessary') out[k]=ins[i].checked;
      }
      choose(out);
    };
    if(openPanel) toggle();
  }

  /* Public API. CBconsent.allows() is what the rest of the site asks before writing
     anything into the browser that is not strictly necessary (see cart.js). */
  window.CBconsent={
    allows:function(cat){ var c=current(); return !!(c&&c[cat]); },
    state:current,
    open:function(){ showBanner(true); }
  };
  window.CBopenConsent=window.CBconsent.open;   // kept: the previous public name

  /* "Ustawienia cookies" link (footer) — re-open the banner so the choice can be changed/withdrawn. */
  document.addEventListener('click',function(e){
    var t=e.target.closest && e.target.closest('.cookie-settings');
    if(t){ e.preventDefault(); showBanner(true); }
  });

  /* On load: restore the previous choice (consent update only); first-time visitors see the banner. */
  var saved=current();
  if(saved) apply(saved);
  else showBanner(false);
})();
