/* Centrum Bolotova — custom cookie consent banner (RODO/ePrivacy). No third-party tools. */
(function(){
  var KEY='cb-consent';
  function set(v){try{localStorage.setItem(KEY,v);}catch(e){}}
  function get(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function loadAnalytics(){ /* gated until consent; add GTM/analytics init here when ready */ }
  if(get()){ if(get()==='all') loadAnalytics(); return; }

  var css='#cb-banner{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#5E2039;color:#f0dfe6;'
    +'font-family:"Open Sans",system-ui,sans-serif;font-size:14px;padding:16px 20px;box-shadow:0 -4px 20px rgba(0,0,0,.25)}'
    +'#cb-banner .cb-in{max-width:1140px;margin:0 auto;display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:space-between}'
    +'#cb-banner a{color:#E6D4A8;text-decoration:underline}'
    +'#cb-banner .cb-btns{display:flex;gap:10px;flex-wrap:wrap}'
    +'#cb-banner button{font-family:"Montserrat",sans-serif;font-weight:700;font-size:13px;border:none;border-radius:40px;'
    +'padding:11px 20px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px}'
    +'#cb-banner .cb-all{background:linear-gradient(90deg,#C9A86A,#E6D4A8);color:#5E2039}'
    +'#cb-banner .cb-ess{background:rgba(255,255,255,.12);color:#fff}';
  var s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);

  var b=document.createElement('div'); b.id='cb-banner';
  b.innerHTML='<div class="cb-in"><span>Używamy plików cookie, aby zapewnić prawidłowe działanie strony oraz — za Twoją zgodą — analizować ruch i ulepszać ofertę. Szczegóły w <a href="polityka-prywatnosci.html">Polityce prywatności</a>.</span>'
    +'<span class="cb-btns"><button class="cb-ess" id="cb-ess">Tylko niezbędne</button><button class="cb-all" id="cb-all">Akceptuj wszystkie</button></span></div>';
  document.body.appendChild(b);
  document.getElementById('cb-all').onclick=function(){set('all');loadAnalytics();b.remove();};
  document.getElementById('cb-ess').onclick=function(){set('essential');b.remove();};
})();
