// Shared chrome for the mockup pages: header with mega menu, footer, strip, lightbox.
(function(){
  const TYPES=[['balzam','Бальзам Болотова'],['kapsuly','Капсулы и комплексы'],['geli','Гели'],['kosmetika','Болотов Косметикс'],['pasty','Зубные пасты'],['komplekty','Комплекты']];
  const SOLS=[['pishchevarenie','Пищеварение'],['ves','Вес'],['davlenie','Давление'],['sahar','Сахар'],['sustavy','Суставы'],['sosudy','Сосуды ног'],['zrenie','Зрение'],['zuby','Зубы и дёсны'],['ochishchenie','Очищение']];
  window.CB={TYPES,SOLS};
  const page=document.body.dataset.page||'';
  const I={
    grid:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    user:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    heart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>',
    cart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/></svg>'
  };
  const LOGO=window.CB_LOGO||'';
  const hdr=document.getElementById('hdr');
  const SAMPLE='';
  const MEGA=`  <div class="mega" id="mega" hidden><div class="wrap">
    <div class="mega-col"><img src="assets/products/balzam-bolotova.webp" alt=""><div><h4>По типу продукта</h4>${TYPES.map(([k,n])=>`<a href="catalog.html#type=${k}">${n}</a>`).join('')}</div></div>
    <div class="mega-col"><img src="assets/products/pilorum-pischevarenie.webp" alt=""><div><h4>Решения</h4>${SOLS.map(([k,n])=>`<a href="catalog.html#sol=${k}">${n}</a>`).join('')}</div></div>
    <div class="mega-col"><img src="assets/products/balzam-bolotova-kurs-2-mesyatsa.webp" alt=""><div><h4>Популярное</h4><a href="catalog.html#flag=hit">Хиты продаж</a><a href="catalog.html#flag=new">Новинки</a><a href="catalog.html">Весь каталог</a><a href="sertifikaty.html">Сертификаты</a></div></div>
  </div></div>`;
  if(hdr&&(page==='catalog'||page==='product')){hdr.outerHTML=SAMPLE+`
<div class="ptop"><div class="wrap"><nav><a href="index.html">О центре</a><a href="#">Доставка и оплата</a><a href="#">Контакты</a><a href="sertifikaty.html">Сертификаты</a><a href="#">Отзывы</a><a href="#">Приглашаем врачей</a><a href="#">Стать партнёром</a></nav><span><b>+7 969 777 06 28</b><a href="#">Консультация врача</a></span></div></div>
<div class="pticker"><div class="strip-track"><ul>${Array(6).fill('<li>Меню по Болотову и консультация врача — бесплатно в нашем Телеграм-канале — <a href="https://t.me/centr_bolotova" target="_blank" rel="noopener">перейти</a></li>').join('')}</ul></div></div>
<header class="site light">
  <div class="wrap phdr">
    <a class="plogo" href="index.html">${LOGO}<span>Центр Болотова<small>Продукция по рецептам академика Болотова</small></span></a>
    <button class="pcat" id="catBtn" aria-expanded="false" aria-controls="mega">${I.grid} Каталог</button>
    <label class="psearch"><input id="q" type="search" placeholder="Поиск по каталогу"><button type="button" id="qBtn" aria-label="Искать">${I.search}</button></label>
    <div class="picons"><a href="#">${I.user}<span>Войти</span></a><a href="#">${I.heart}<span>Избранное</span></a><a href="#">${I.cart}<span>Корзина</span></a></div>
  </div>
  ${MEGA}
</header>`;
  } else if(hdr){hdr.outerHTML=SAMPLE+`
${'<div class="topbar">Меню по Болотову и консультация врача — бесплатно в нашем <a href="https://t.me/centr_bolotova" target="_blank" rel="noopener">Телеграм-канале</a></div>'}
<header class="site">
  <div class="wrap hdr">
    <a class="logo" href="index.html">${LOGO}Центр Болотова</a>
    <label class="search">${I.search}<input id="q" type="search" placeholder="Поиск"><button type="button" id="qBtn">НАЙТИ</button></label>
    <nav class="nav">
      <button class="cat-btn" id="catBtn" aria-expanded="false" aria-controls="mega"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h10"/></svg>Каталог</button>
      <a href="sertifikaty.html">Сертификаты</a>
      <a href="#">Отзывы</a>
      <a href="#">Ещё ▾</a>
    </nav>
    <a class="cart-btn" href="#">Корзина</a>
  </div>
  ${MEGA}
</header>`;
  }
  if(hdr){
    const btn=document.getElementById('catBtn'),mega=document.getElementById('mega');
    btn.addEventListener('click',()=>{const o=mega.hidden;mega.hidden=!o;btn.setAttribute('aria-expanded',o)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){mega.hidden=true;btn.setAttribute('aria-expanded',false)}});
    const go=()=>location.href='catalog.html#q='+encodeURIComponent(document.getElementById('q').value);document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')go()});document.getElementById('qBtn').onclick=go;
  }
  const ftr=document.getElementById('ftr');
  if(ftr){ftr.outerHTML=`
<footer>
  <div class="wrap f-cta"><h2>Меню по Болотову — бесплатно</h2><p>Подпишитесь на Телеграм-канал Центра Болотова и получите меню по Болотову и консультацию врача.</p><a class="btn light" href="https://t.me/centr_bolotova" target="_blank" rel="noopener">Подписаться в Телеграм</a></div>
  <div class="wrap f-cols">
    <div><span class="flogo">${LOGO}</span><p style="margin:0">Бальзам Болотова и продукция по рецептам академика Бориса Болотова. Официальный сайт производителя.</p></div>
    <div><h5>Каталог</h5>${TYPES.map(([k,n])=>`<a href="catalog.html#type=${k}">${n}</a>`).join('')}</div>
    <div><h5>Покупателям</h5><a href="#">Оплата</a><a href="#">Доставка</a><a href="#">Возврат</a><a href="sertifikaty.html">Сертификаты</a></div>
    <div><h5>Связь</h5><a href="tel:+79697770628">+7 969 777 06 28</a><a href="tel:+74993504474">+7 499 350 44 74</a><a href="https://t.me/centr_bolotova">Телеграм-канал</a></div>
  </div>
  <div class="wrap f-legal">ИП Чужа Ксения Викторовна · ОГРНИП 324774600648129 · ИНН 771694622918<br>Изготовитель: ООО «КоролёвФарм», 141074, Московская обл., г. Королёв, ул. Пионерская, д. 4 · БАД не является лекарственным средством</div>
</footer>
<a class="chat" href="https://t.me/centr_bolotova" aria-label="Телеграм"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg></a>`;}

  // logo slots placed in page markup
  document.querySelectorAll('.lg').forEach(e=>e.innerHTML=LOGO);

  // strip: duplicate the list so the loop is seamless
  document.querySelectorAll('.strip-track').forEach(t=>{const u=t.querySelector('ul');const c=u.cloneNode(true);c.setAttribute('aria-hidden','true');t.appendChild(c)});

  // ring of checks
  document.querySelectorAll('.ring[data-n]').forEach(r=>{const n=+r.dataset.n;for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n,d=document.createElement('div');d.className='dot';d.style.left=(50+40*Math.cos(a))+'%';d.style.top=(50+40*Math.sin(a))+'%';d.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>';r.appendChild(d)}});

  // document scans
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-img]');if(!t)return;
    const lb=document.createElement('div');lb.className='lb';
    lb.innerHTML=`<button class="x" aria-label="Закрыть">×</button><div class="pair">${t.dataset.img.split(',').map(s=>`<img src="assets/docs/${s.trim()}.webp" alt="">`).join('')}</div><div class="cap">${t.dataset.cap||''}</div>`;
    lb.addEventListener('click',ev=>{if(ev.target===lb||ev.target.classList.contains('x'))lb.remove()});
    document.body.appendChild(lb);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.lb')?.remove()});

  // product card markup shared by home and catalog
  const TN=Object.fromEntries(TYPES);
  const PAGES={'balzam-bolotova':'product.html'}; // product pages built so far
  const ALT={'balzam-bolotova':'assets/hero-balzam.webp'};
  window.CB.card=p=>{
    const url=PAGES[p.id]||'#';
    const alt=p.img2?`assets/products/${p.id}-2.webp`:ALT[p.id];
    return `<article class="pcard">
    <div class="flags"><span class="flag t-${p.type}">${TN[p.type]}</span>${p.hit?'<span class="flag hit">Хит</span>':''}${p.new?'<span class="flag new">Новинка</span>':''}</div>
    <button class="fav" aria-label="В избранное">${I.heart}</button>
    <a class="img${alt?' has-alt':''}" href="${url}"><img class="main" src="assets/products/${p.id}.webp" alt="" loading="lazy">${alt?`<img class="alt" src="${alt}" alt="" loading="lazy">`:''}<span class="quick">Быстрый просмотр</span></a>
    <div class="dots${alt?' two':''}"><i></i>${alt?'<i></i>':''}<i></i><i></i></div>
    <div class="price">${p.price.toLocaleString('ru-RU')} ₽</div>
    <a class="name" href="${url}">${p.name}</a>
    <div class="meta"><span><span class="st">★</span> нет оценок</span><span class="ok">✓ В наличии</span></div>
    <button class="btn">В корзину</button>
  </article>`};
})();
