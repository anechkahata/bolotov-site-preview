/* Centrum Bolotova — custom cookie consent banner (GDPR/ePrivacy). No third-party tools.
   Consent Mode v2: the default ('denied') is set inline in <head>. Here we record the user's
   choice, push the consent update, and allow changing/withdrawing it later — any element with
   class "cookie-settings" (the footer «Nastavení cookies» / «Nastavenia cookies» link) re-opens the banner. */
(function(){
  var KEY='cb-consent';
  function set(v){try{localStorage.setItem(KEY,v);}catch(e){}}
  function get(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function gtag(){(window.dataLayer=window.dataLayer||[]).push(arguments);}
  function grant(){
    gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
    (window.dataLayer=window.dataLayer||[]).push({event:'cookie_consent_granted'});
    try{document.dispatchEvent(new Event('cb:consent'));}catch(e){}   // cart.js keeps the visit's ad tags from now on
  }
  function deny(){
    gtag('consent','update',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
    (window.dataLayer=window.dataLayer||[]).push({event:'cookie_consent_denied'});
  }

  function injectCss(){
    if(document.getElementById('cb-style')) return;
    /* White and plain (owner, 2026-11-01): the wine bar melted into the wine page sections and she
       could hardly find it. A dark top rule and a shadow lift it off any page. */
    var css='#cb-banner{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#fff;color:#2b2226;'
      +'font-family:"Open Sans",system-ui,sans-serif;font-size:14px;padding:16px 20px;border-top:3px solid #5E2039;'
      +'box-shadow:0 -8px 28px rgba(0,0,0,.28)}'
      +'#cb-banner .cb-in{max-width:1140px;margin:0 auto;display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:space-between}'
      +'#cb-banner a{color:#5E2039;text-decoration:underline}'
      +'#cb-banner .cb-btns{display:flex;gap:10px;flex-wrap:wrap}'
      +'#cb-banner button{font-family:"Montserrat",sans-serif;font-weight:700;font-size:13px;border-radius:8px;'
      +'padding:11px 20px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px}'
      +'#cb-banner .cb-all{background:#5E2039;color:#fff;border:2px solid #5E2039}'
      +'#cb-banner .cb-ess{background:#fff;color:#5E2039;border:2px solid #5E2039}';
    var s=document.createElement('style'); s.id='cb-style'; s.textContent=css; document.head.appendChild(s);
  }

  function showBanner(){
    if(document.getElementById('cb-banner')) return;   // already visible
    injectCss();
    var C=(window.CB && window.CB.cookies) || {};
    var b=document.createElement('div'); b.id='cb-banner';
    b.innerHTML='<div class="cb-in"><span>'+((C.textShort && window.matchMedia && window.matchMedia('(max-width:640px)').matches) ? C.textShort : C.text)+'</span>'
      +'<span class="cb-btns"><button class="cb-ess" id="cb-ess">'+C.essentialOnly+'</button><button class="cb-all" id="cb-all">'+C.acceptAll+'</button></span></div>';
    document.body.appendChild(b);
    document.getElementById('cb-all').onclick=function(){set('all');grant();b.remove();};
    document.getElementById('cb-ess').onclick=function(){set('essential');deny();b.remove();};
  }
  window.CBopenConsent=showBanner;

  /* The cookie-settings link in the footer — re-open the banner so the choice can be
     changed or withdrawn. */
  document.addEventListener('click',function(e){
    var t=e.target.closest && e.target.closest('.cookie-settings');
    if(t){ e.preventDefault(); showBanner(); }
  });

  /* On load: restore the previous choice (consent update only); first-time visitors see the banner. */
  if(get()){ if(get()==='all') grant(); else deny(); }
  else { showBanner(); }
})();
