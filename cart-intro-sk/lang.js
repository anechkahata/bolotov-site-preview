/* Centrum Bolotova — Slovak storefront: everything the shared scripts must not hard-code.
 *
 * Loaded BEFORE cart.js / forms.js / cookies.js on every page. `cz/lang.js` is the same
 * file in Czech; the shared scripts hold the logic and the prices, this holds the words.
 *
 * Product names are the canon's own `names.sk` (knowledge-base/finance/catalog.json), the
 * same strings the backend writes onto the amoCRM card — so the page, the CRM and the
 * warehouse list all call a product the same thing.
 *
 * Prices are NOT here — they live in shared/cart.js (PRICES), keyed by market, and are
 * checked against the canon by backend/tools/verify-catalog.php.
 */
window.CB = {
  lang: 'sk',

  /* Default delivery country of this domain (centrumbolotova.sk). The visitor can still
     switch to Czechia in the cart — see shops/README.md → «Domains and markets». */
  market: 'SK',

  cartPage: 'kosik.html',

  /* Set pictures of THIS storefront: Czech or Slovak names and prices, taken from the live
     centerbolotova.eu/sk/ (owner, 2026-09-15). cart.js appends «beauty-1.webp» etc. */
  setImg: 'media/img/sets/sk-',
  /* Tags on set cards in the catalog (drawn by cart.js; the same words the old set banners carried). */
  setTags: { 'set-reflux-paleni-zahy': 'Líder predaja', 'set-tezkost-nadymani': 'Top výber', 'set-reflux-start': 'Spolu výhodnejšie', 'set-complete-skin': 'TOP voľba', 'set-kolagenovy-kurz': 'Najlepšia cena', 'set-total-beauty': 'Odporúčame', 'set-anti-age': 'Premium', 'set-den-noc': 'Novinka', 'set-vlasy-nehty': 'Novinka', 'set-beauty-base': 'Na začiatok' },
  wa: 'https://wa.me/421944623644?text=Dobr%C3%BD%20de%C5%88',

  names: {
    'balzam-250':             'Balzam Bolotova 250 ml',
    'balzam-500':             'Balzam Bolotova 500 ml',
    'shots-20':               'Marine Collagen Shots 20 × 25 ml',
    'shots-30':               'Marine Collagen Shots 30 × 25 ml',
    'krem-noc':               'Nočný krém Collagen Deluxe 50 ml',
    'l-glutamine':            'L-Glutamine Gastric Restore Complex',
    'hyaluronic':             'Hyaluronic Acid + Vitamin C',
    'biotin':                 'Biotin Zinc Selenium',
    'kniha':                  'Tajomstvo zdravého života — Boris Bolotov',
    'set-beauty-base':         'Komplet Beauty Base System',
    'set-den-noc':             'Komplet Deň & Noc',
    'set-complete-skin':       'Komplet Complete Skin System',
    'set-total-beauty':        'Komplet Total Beauty Support System',
    'set-vlasy-nehty':         'Komplet Vlasy & nechty',
    'set-anti-age':            'Kompletná anti-age kúra 8 týždňov',
    'set-reflux-paleni-zahy': 'Program na reflux a pálenie záhy',
    'set-tezkost-nadymani':   'Program pri ťažobe a nadúvaní',
    'set-traveni-klouby':     'Komplet Trávenie & Kĺby',
    'set-kolagenovy-kurz':     'Intenzívna kúra 8 týždňov',
    'set-restart':            'Komplet Bolotov Reštart Program',
    'set-reflux-start':       'Program na reflux a pálenie záhy START',
    'vanoce-rychla':           'Rýchla sviatočná pohoda',
    'vanoce-lehke':            'Ľahké Vianoce',
    'vanoce-pro-dva':          'Zdravé Vianoce pre dvoch',
    'vanoce-rodina':           'Pre celú rodinu',
    'vanoce-rodina-kniha':     'Pre celú rodinu + kniha',
    'vanoce-zimni-zasoba':     'Zimná zásoba',
    'vanoce-velka-zasoba':     'Veľká zimná zásoba',
    'set-black-friday':        'Black Friday: 3 produkty za cenu 1'
  },

  /* The cart ids stay the ones the backend knows (they are Czech words); only the
     filenames are Slovak. Never rename a key here — `market` and the ids are the contract
     with backend/src/Pricing.php. */
  urls: {
    'balzam-250':             'produkt-balzam.html',
    'balzam-500':             'produkt-balzam.html',
    'shots-20':               'marine-collagen-shots.html',
    'shots-30':               'marine-collagen-shots.html',
    'krem-noc':               'nocny-krem-collagen-deluxe.html',
    'l-glutamine':            'l-glutamine.html',
    'hyaluronic':             'hyaluronic-acid-vitamin-c.html',
    'biotin':                 'biotin-zinc-selenium.html',
    'kniha':                  'kniha-tajomstvo-zdraveho-zivota.html',
    'set-beauty-base':        'set-beauty-base-system.html',
    'set-den-noc':             'set-den-a-noc.html',
    'set-complete-skin':       'set-complete-skin-system.html',
    'set-total-beauty':        'set-total-beauty-support-system.html',
    'set-vlasy-nehty':         'set-vlasy-a-nechty.html',
    'set-anti-age':            'set-kompletna-anti-age-kura.html',
    'set-reflux-paleni-zahy': 'set-reflux-palenie-zahy.html',
    'set-tezkost-nadymani':   'set-tazoba-naduvanie.html',
    'set-traveni-klouby':     'set-travenie-klby.html',
    'set-kolagenovy-kurz':    'set-intenzivny-kolagenovy-kurz.html',
    'set-restart':            'set-bolotov-restart.html',
    'set-reflux-start':       'set-reflux-start.html',
    'vanoce-rychla':           'zdrave-vianoce.html#vanoce-rychla',
    'vanoce-lehke':            'zdrave-vianoce.html#vanoce-lehke',
    'vanoce-pro-dva':          'zdrave-vianoce.html#vanoce-pro-dva',
    'vanoce-rodina':           'zdrave-vianoce.html#vanoce-rodina',
    'vanoce-rodina-kniha':     'zdrave-vianoce.html#vanoce-rodina-kniha',
    'vanoce-zimni-zasoba':     'zdrave-vianoce.html#vanoce-zimni-zasoba',
    'vanoce-velka-zasoba':     'zdrave-vianoce.html#vanoce-velka-zasoba',
    'set-black-friday':        'black-friday.html'
  },

  /* Contents of the sets that carry a gift inside (the Christmas sets) — shown under the set in the
     cart, from shops/legacy-bitrix/pages/vanoce/sets.json (tools/gen-vanoce.py reads the same). */
  /* The free printed guide of a set, appended to its contents line in the cart (cart.js setContents). Names from
     backend/src/Catalog.data.php → GUIDES; the Christmas sets spell theirs out in `contents` below. */
  guides: {
    'set-reflux-paleni-zahy': 'Tlačený sprievodca (14 dní) zadarmo',
    'set-tezkost-nadymani': 'Tlačený sprievodca (7 dní) zadarmo',
    'set-reflux-start': 'Tlačený sprievodca (14 dní) zadarmo',
  },
  contents: {
    'vanoce-rychla':           "Balzam Bolotova 250 ml + L-Glutamine Gastric Restore Complex (90 kaps.) + Tlačený sprievodca „Ťažoba a nadúvanie“ — 7 dní",
    'vanoce-lehke':            "Balzam Bolotova 500 ml + L-Glutamine Gastric Restore Complex (90 kaps.) + Tlačený sprievodca „Pálenie záhy a reflux“ — 14 dní + Tlačený sprievodca „Ťažoba a nadúvanie“ — 7 dní + darček: Kniha „Tajemství zdravého života“ (v češtine)",
    'vanoce-pro-dva':          "2 × Balzam Bolotova 500 ml",
    'vanoce-rodina':           "3 × Balzam Bolotova 500 ml + darček: 1 × Balzam Bolotova 500 ml",
    'vanoce-rodina-kniha':     "4 × Balzam Bolotova 500 ml + darček: Kniha „Tajemství zdravého života“ (v češtine)",
    'vanoce-zimni-zasoba':     "3 × Balzam Bolotova 500 ml + darček: Balzam Bolotova 250 ml",
    'vanoce-velka-zasoba':     "5 × Balzam Bolotova 500 ml + darček: Balzam Bolotova 250 ml + kniha „Tajemství zdravého života“ (v češtine)",
    'set-black-friday':        "2 × Balzam Bolotova 250 ml + darček: L-Glutamine Gastric Restore Complex (90 kaps.)"
  },
  /* Two Christmas sets have a Slovak picture of their own. */
  images: {
    'vanoce-rychla': 'media/img/vanoce/rychla-sk.jpg',
    'vanoce-lehke':  'media/img/vanoce/lehke-sk.jpg'
  },

  /* Discount codes. NOT written here: they come from the canon register
     knowledge-base/finance/promos.json, which is the one place every shop reads, so the same
     code means the same thing in Poland, Czechia and Slovakia. Rebuild after editing the canon:
     php backend/tools/gen-promos.php  —  and verify-catalog.php fails if this copy drifts. */
  /* Odberné miesta — Packeta na Slovensku, Zásilkovna v Česku. Vysvetlenie je v českom lang.js
     (rovnaká mechanika, iné slová): zoznam hľadá v našej kópii katalógu pobočiek zo skladu, mapu
     kreslí widget Packety. `key` je nepovinný — widget funguje aj s prázdnym. */
  pickup: {
    key:       '',
    title:     'Výdajné miesto',
    hint:      'Zadajte mesto alebo PSČ a vyberte miesto, kde si zásielku vyzdvihnete.',
    search:    'Mesto alebo PSČ',
    map:       'Vybrať na mape',
    change:    'Zmeniť',
    searching: 'Hľadáme…',
    none:      'Nič sme nenašli. Skúste iné mesto alebo PSČ.',
    more:      'Zobrazujeme prvých {shown} z {total} — spresnite hľadanie.',
    required:  'Vyberte výdajné miesto.',
    failed:    'Zoznam miest sa teraz nenačítal. Skúste to prosím znova.'
  },

  /* ===== PROMOS: GENERATED from knowledge-base/finance/promos.json — DO NOT EDIT ===== */
  /* Rebuild with: php backend/tools/gen-promos.php  (verify-catalog.php checks the copy) */
  promos: {
    'balsam15': { code: 'BALSAM15', type: 'unit_price', ids: ['balzam-500'], price: 35, maxQty: 2, label: 'Balzam 500 ml za 35 €' },
    'balsam15sk': { code: 'BALSAM15SK', type: 'unit_price', ids: ['balzam-500'], price: 35, maxQty: 2, label: 'Balzam 500 ml za 35 €' },
    'olehsk': { code: 'OLEHSK', type: 'unit_price', ids: ['balzam-500'], price: 35, maxQty: 2, label: 'Balzam 500 ml za 35 €' },
    'zlava': { code: 'ZLAVA', type: 'unit_price', ids: ['balzam-500'], price: 35, maxQty: 2, label: 'Balzam 500 ml za 35 €' },
    'narodeniny': { code: 'NARODENINY', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10 % k narodeninám' },
    'vraciame': { code: 'VRACIAME', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10 % návrat' },
    'recenzia20': { code: 'RECENZIA20', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 20, scope: 'products', stacks: false, label: '−20 % za recenziu' },
    'dakujeme': { code: 'DAKUJEME', type: 'percent', percent: 15, scope: 'order', stacks: true, validFrom: '2026-12-25', validUntil: '2027-02-01', label: '−15 % s poďakovaním' },
    'sekretsk': { code: 'SEKRETSK', type: 'bundle_prices', ids: ['balzam-500', 'balzam-250'], prices: { 'balzam-500': 41, 'balzam-250': 0 }, label: 'Balzam 500 ml + 250 ml ako darček' },
    'kolagenhyalsk': { code: 'KOLAGENHYALSK', type: 'bundle_prices', ids: ['shots-20', 'hyaluronic'], prices: { 'shots-20': 59, 'hyaluronic': 0 }, label: 'Marine Collagen Shots 20 + Hyaluronic Acid + Vitamin C ako darček' },
    'sl-vql2w-cmzp33m': { code: 'SL-VQL2W-CMZP33M', type: 'bundle_prices', ids: ['balzam-500', 'kniha'], prices: { 'balzam-500': 41, 'kniha': 0 }, label: 'Balzam 500 ml + kniha ako darček' },
    'sl-uw92f-dax02fq': { code: 'SL-UW92F-DAX02FQ', type: 'bundle_prices', ids: ['balzam-250', 'kniha'], prices: { 'balzam-250': 29, 'kniha': 0 }, label: 'Balzam 250 ml + kniha ako darček' },
    'verny40': { code: 'VERNY40', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 40, scope: 'products', stacks: false, validUntil: '2026-12-14', label: '−40 % pre verných zákazníkov' },
    'verny30': { code: 'VERNY30', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 30, scope: 'products', stacks: false, validUntil: '2026-12-14', label: '−30 % pre verných zákazníkov' },
  },
  promoMarket: 'SK',
  promosAlt: {
    'CZ': {
      'balsam15': { code: 'BALSAM15', type: 'unit_price', ids: ['balzam-500'], price: 860, maxQty: 2, label: 'Balzám 500 ml za 860 CZK' },
      'olehcz': { code: 'OLEHCZ', type: 'unit_price', ids: ['balzam-500'], price: 860, maxQty: 2, label: 'Balzám 500 ml za 860 CZK' },
      'sleva': { code: 'SLEVA', type: 'unit_price', ids: ['balzam-500'], price: 860, maxQty: 2, label: 'Balzám 500 ml za 860 CZK' },
      'narozeniny': { code: 'NAROZENINY', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10 % k narozeninám' },
      'vracime': { code: 'VRACIME', type: 'percent', percent: 10, scope: 'order', stacks: false, label: '−10 % návrat' },
      'recenze20': { code: 'RECENZE20', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 20, scope: 'products', stacks: false, label: '−20 % za recenzi' },
      'dekujeme': { code: 'DEKUJEME', type: 'percent', percent: 15, scope: 'order', stacks: true, validFrom: '2026-12-25', validUntil: '2027-02-01', label: '−15 % s poděkováním' },
      'sekret': { code: 'SEKRET', type: 'bundle_prices', ids: ['balzam-500', 'balzam-250'], prices: { 'balzam-500': 1010, 'balzam-250': 0 }, label: 'Balzám 500 ml + 250 ml jako dárek' },
      'kolagenhyal': { code: 'KOLAGENHYAL', type: 'bundle_prices', ids: ['shots-20', 'hyaluronic'], prices: { 'shots-20': 1450, 'hyaluronic': 0 }, label: 'Marine Collagen Shots 20 + Hyaluronic Acid + Vitamin C jako dárek' },
      'refluxkniha': { code: 'REFLUXKNIHA', type: 'bundle_prices', ids: ['set-reflux-paleni-zahy', 'kniha'], prices: { 'set-reflux-paleni-zahy': 1449, 'kniha': 0 }, label: 'Program na reflux a pálení žáhy + kniha jako dárek' },
      'nadymanikniha': { code: 'NADYMANIKNIHA', type: 'bundle_prices', ids: ['set-tezkost-nadymani', 'kniha'], prices: { 'set-tezkost-nadymani': 1099, 'kniha': 0 }, label: 'Program při těžkosti a nadýmání + kniha jako dárek' },
      'sl-e61go-pzztqrg': { code: 'SL-E61GO-PZZTQRG', type: 'bundle_prices', ids: ['balzam-500', 'kniha'], prices: { 'balzam-500': 1010, 'kniha': 0 }, label: 'Balzám 500 ml + kniha jako dárek' },
      'sl-k928o-y57zrnd': { code: 'SL-K928O-Y57ZRND', type: 'bundle_prices', ids: ['balzam-250', 'kniha'], prices: { 'balzam-250': 799, 'kniha': 0 }, label: 'Balzám 250 ml + kniha jako dárek' },
      'verny40': { code: 'VERNY40', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 40, scope: 'products', stacks: false, validUntil: '2026-12-14', label: '−40 % pro věrné zákazníky' },
      'verny30': { code: 'VERNY30', type: 'percent', ids: ['balzam-250', 'balzam-500', 'shots-20', 'shots-30', 'krem-noc', 'l-glutamine', 'hyaluronic', 'biotin', 'kniha'], percent: 30, scope: 'products', stacks: false, validUntil: '2026-12-14', label: '−30 % pro věrné zákazníky' },
    },
  },
  /* ===== /PROMOS ===== */

  forms: {
    phoneCountry: 'sk',
    msg: {
      req:        'Vyplňte toto pole.',
      emailEmpty: 'Zadajte e-mailovú adresu.',
      emailBad:   'Neplatná e-mailová adresa (napr. jan@example.com).',
      phoneEmpty: 'Zadajte telefónne číslo.',
      phoneBad:   'Neplatné telefónne číslo pre vybranú krajinu.',
      consent:    'Zaškrtnite súhlas, aby ste mohli pokračovať.'
    },
    thanksLead:        'Ďakujeme! ✓',
    thanksLeadText:    'Skontrolujte schránku — sprievodca je na ceste.',
    thanksLeadMail:    'Ďalšie tipy vám pošleme e-mailom.',
    thanksReview:      'Ďakujeme za hodnotenie! ✓',
    thanksReviewText:  'Po schválení sa objaví na stránke.',
    thanksInquiry:     'Ďakujeme! ✓',
    thanksInquiryText: 'Prijali sme vašu žiadosť — čoskoro sa ozveme.',
    thanksBirthday:    'Ďakujeme! ✓',
    thanksBirthdayText: 'Dátum sme si uložili. Ak u nás s týmto e-mailom nakupujete, v deň narodenín vám pošleme zľavu.',
    withdrawalFailed: 'Formulár sa nepodarilo odoslať. Skúste to, prosím, znova alebo napíšte na info@centerbolotova.eu — lehota je zachovaná, ak odstúpenie odošlete pred jej uplynutím.',
    thanksWithdrawal:     'Odstúpenie sme prijali ✓',
    thanksWithdrawalText: 'Potvrdenie sme vám poslali e-mailom. Tovar, prosím, zašlite do 14 dní na adresu uvedenú v potvrdení.'
  },

  cookies: {
    text: 'Používame cookies, aby stránka fungovala správne a — s vaším súhlasom — aby sme merali návštevnosť a účinnosť reklamy (Google Analytics, Meta pixel). Podrobnosti v <a href="zasady-ochrany-osobnych-udajov.html">Zásadách ochrany osobných údajov</a> a <a href="zasady-cookies.html">Zásadách cookies</a>.',
    // Phones (≤ 640 px, owner 2026-10-29): two lines instead of five, so the bar does not hide the order button;
    // the cookie page it links to names every tool and links the privacy policy.
    textShort: 'Cookies na štatistiku a reklamu len so súhlasom. <a href="zasady-cookies.html">Viac</a>',
    essentialOnly: 'Iba nevyhnutné',
    acceptAll:     'Prijať všetko'
  },

  t: {
    cardPromo: {
      on:        'Kód {code} je aktívny ({label}) — v košíku zaplatíte',
      omnibus:   'Najnižšia cena za 30 dní pred zľavou: {price}',
      bundle:    'Kód {code} je aktívny: {label}. Platí, keď sú v košíku všetky položky akcie.',
      bundleAdd: 'Pridať všetko do košíka — {price}',
      bundleIn:  'Všetko už máte v košíku.',
      ladder:    'Kód {code} je aktívny, ale táto cena je už nižšia než so zľavou — zľavy sa nesčítavajú, platíte tú nižšiu.',
      scope:     'Kód {code} je aktívny ({label}) — na tento produkt sa nevzťahuje.'
    },
    cartLink:     'Košík',
    close:        'Zavrieť',
    added:        'Pridané do košíka',
    goToCart:     'Prejsť do košíka',
    keepShopping: 'Pokračovať v nákupe',
    qtyLabel:     'Množstvo:',
    inCartLabel:  'v košíku:',
    inCartSum:    'V košíku: {n} ks · {sum}',
    toTop:        'Nahor',
    promoStarts:  '🎁 Ďakujeme, že ste s nami! Váš darček — zľava {pct} % s kódom {code} — čaká od {from} do {until}.',   // owner 1.11: variant B
    promoStartsBtn: 'OK',
    youSave:      'ušetríte {n}',
    reviewAlt:    'Hodnotenie',
    recentTitle:  'Naposledy prezerané',

    exit: {
      cartTitle:       'Nezabudnite na svoj košík 🛒',
      cartText:        'Vaše produkty čakajú. Dokončite objednávku, alebo nám napíšte — pomôžeme vybrať produkty a odpovieme na otázky.',
      backToCart:      'Späť do košíka',
      writeWa:         'Napíšte na WhatsApp',
      guideCover:      'assets/img/guide-cover-sk.webp',
      guideCoverAlt:   'Bezplatný sprievodca metódou Bolotova',
      guideTitle:      'Počkajte — získajte bezplatného sprievodcu',
      guideText:       'Nechajte nám e-mail a hneď si stiahnite BEZPLATNÉHO sprievodcu systémom Bolotova — jednoduché princípy výživy a životného štýlu.',
      emailPlaceholder:'Váš e-mail *',
      consent:         'Chcem dostávať e-maily Centra Bolotova s tipmi a ponukami. Súhlas môžem kedykoľvek odvolať odkazom v každom e-maile.',
      privacy:         'Údaje spracúvame podľa <a href="zasady-ochrany-osobnych-udajov.html" style="color:inherit;text-decoration:underline">zásad ochrany osobných údajov</a>.',
      guidePdf:        'https://drive.google.com/file/d/10OaGQd8NeosB7cOF_6Q4xG3PLrtnosgn/view',
      guidePdfLabel:   'Stiahnuť príručku (PDF)',
      submit:          'Získať sprievodcu',
      noSpam:          'Žiadny spam. Kedykoľvek sa môžete odhlásiť.',
      emailBad:        'Neplatná e-mailová adresa (napr. jan@example.com).',
      emailEmpty:      'Zadajte e-mailovú adresu.',
      consentRequired: 'Zaškrtnite súhlas, aby ste mohli pokračovať.',
      thanksTitle:     'Ďakujeme! ✓',
      thanksText:      'Ďalšie tipy vám pošleme e-mailom.'
    }
  }
};
