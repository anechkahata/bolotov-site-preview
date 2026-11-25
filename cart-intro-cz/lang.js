/* Centrum Bolotova — Czech storefront: everything the shared scripts must not hard-code.
 *
 * Loaded BEFORE cart.js / forms.js / cookies.js on every page. `sk/lang.js` is the same
 * file in Slovak; the shared scripts hold the logic and the prices, this holds the words.
 *
 * Prices are NOT here — they live in shared/cart.js (PRICES), keyed by market, and are
 * checked against the canon by backend/tools/verify-catalog.php.
 */
window.CB = {
  lang: 'cs',

  /* Default delivery country of this domain (centrumbolotova.cz). The visitor can still
     switch to Slovakia in the cart — see shops/README.md → «Domains and markets». */
  market: 'CZ',

  cartPage: 'kosik.html',

  /* Set pictures of THIS storefront: Czech or Slovak names and prices, taken from the live
     centerbolotova.eu/cz/ (owner, 2026-09-15). cart.js appends «beauty-1.webp» etc. */
  setImg: 'media/img/sets/cz-',
  /* Tags on set cards in the catalog (drawn by cart.js; the same words the old set banners carried). */
  setTags: { 'set-reflux-paleni-zahy': 'Lídr prodeje', 'set-tezkost-nadymani': 'Top výběr', 'set-reflux-start': 'Spolu výhodněji', 'set-complete-skin': 'TOP volba', 'set-kolagenovy-kurz': 'Nejlepší cena', 'set-total-beauty': 'Doporučujeme', 'set-anti-age': 'Premium', 'set-den-noc': 'Novinka', 'set-vlasy-nehty': 'Novinka', 'set-beauty-base': 'Pro začátek' },
  wa: 'https://wa.me/421944623644?text=Dobr%C3%BD%20den',

  /* Product names as they appear on the storefront and in the order sent to amoCRM. */
  names: {
    'balzam-250':             'Balzám Bolotova 250 ml',
    'balzam-500':             'Balzám Bolotova 500 ml',
    'shots-20':               'Marine Collagen Shots 20 × 25 ml',
    'shots-30':               'Marine Collagen Shots 30 × 25 ml',
    'krem-noc':               'Noční krém Collagen Deluxe 50 ml',
    'l-glutamine':            'L-Glutamine Gastric Restore Complex',
    'hyaluronic':             'Hyaluronic Acid + Vitamin C',
    'biotin':                 'Biotin Zinc Selenium',
    'kniha':                  'Tajemství zdravého života — Boris Bolotov',
    'set-beauty-base':         'Komplet Beauty Base System',
    'set-den-noc':             'Komplet Den & Noc',
    'set-complete-skin':       'Komplet Complete Skin System',
    'set-total-beauty':        'Komplet Total Beauty Support System',
    'set-vlasy-nehty':         'Komplet Vlasy & nehty',
    'set-anti-age':            'Kompletní anti-age kúra 8 týdnů',
    'set-reflux-paleni-zahy': 'Program na reflux a pálení žáhy',
    'set-tezkost-nadymani':   'Program při těžkosti a nadýmání',
    'set-traveni-klouby':     'Komplet Trávení & Klouby',
    'set-kolagenovy-kurz':     'Intenzivní kúra 8 týdnů',
    'set-restart':            'Komplet Bolotov Restart Program',
    'set-reflux-start':       'Program na reflux a pálení žáhy START',
    'vanoce-rychla':           'Rychlá sváteční pohoda',
    'vanoce-lehke':            'Lehké Vánoce',
    'vanoce-pro-dva':          'Zdravé Vánoce pro dva',
    'vanoce-rodina':           'Pro celou rodinu',
    'vanoce-rodina-kniha':     'Pro celou rodinu + kniha',
    'vanoce-zimni-zasoba':     'Zimní zásoba',
    'vanoce-velka-zasoba':     'Velká zimní zásoba',
    'set-black-friday':        'Black Friday: 3 produkty za cenu 1'
  },

  /* Which page sells which product. The Slovak site uses its own filenames. */
  urls: {
    'balzam-250':             'produkt-balzam.html',
    'balzam-500':             'produkt-balzam.html',
    'shots-20':               'marine-collagen-shots.html',
    'shots-30':               'marine-collagen-shots.html',
    'krem-noc':               'nocni-krem-collagen-deluxe.html',
    'l-glutamine':            'l-glutamine.html',
    'hyaluronic':             'hyaluronic-acid-vitamin-c.html',
    'biotin':                 'biotin-zinc-selenium.html',
    'kniha':                  'kniha-tajemstvi-zdraveho-zivota.html',
    'set-beauty-base':        'set-beauty-base-system.html',
    'set-den-noc':             'set-den-a-noc.html',
    'set-complete-skin':       'set-complete-skin-system.html',
    'set-total-beauty':        'set-total-beauty-support-system.html',
    'set-vlasy-nehty':         'set-vlasy-a-nehty.html',
    'set-anti-age':            'set-kompletni-anti-age-kura.html',
    'set-reflux-paleni-zahy': 'set-reflux-paleni-zahy.html',
    'set-tezkost-nadymani':   'set-tezkost-nadymani.html',
    'set-traveni-klouby':     'set-traveni-klouby.html',
    'set-kolagenovy-kurz':    'set-intenzivni-kolagenovy-kurz.html',
    'set-restart':            'set-bolotov-restart.html',
    'set-reflux-start':       'set-reflux-start.html',
    'vanoce-rychla':           'zdrave-vanoce.html#vanoce-rychla',
    'vanoce-lehke':            'zdrave-vanoce.html#vanoce-lehke',
    'vanoce-pro-dva':          'zdrave-vanoce.html#vanoce-pro-dva',
    'vanoce-rodina':           'zdrave-vanoce.html#vanoce-rodina',
    'vanoce-rodina-kniha':     'zdrave-vanoce.html#vanoce-rodina-kniha',
    'vanoce-zimni-zasoba':     'zdrave-vanoce.html#vanoce-zimni-zasoba',
    'vanoce-velka-zasoba':     'zdrave-vanoce.html#vanoce-velka-zasoba',
    'set-black-friday':        'black-friday.html'
  },

  /* Contents of the sets that carry a gift inside (the Christmas sets) — shown under the set in the
     cart, from shops/legacy-bitrix/pages/vanoce/sets.json (tools/gen-vanoce.py reads the same). */
  /* The free printed guide of a set, appended to its contents line in the cart (cart.js setContents). Names from
     backend/src/Catalog.data.php → GUIDES; the Christmas sets spell theirs out in `contents` below. */
  guides: {
    'set-reflux-paleni-zahy': 'Tištěný průvodce (14 dní) zdarma',
    'set-tezkost-nadymani': 'Tištěný průvodce (7 dní) zdarma',
    'set-reflux-start': 'Tištěný průvodce (14 dní) zdarma',
  },
  contents: {
    'vanoce-rychla':           "Balzám Bolotova 250 ml + L-Glutamine Gastric Restore Complex (90 kaps.) + Tištěný průvodce „Těžkost a nadýmání“ — 7 dní",
    'vanoce-lehke':            "Balzám Bolotova 500 ml + L-Glutamine Gastric Restore Complex (90 kaps.) + Tištěný průvodce „Pálení žáhy a reflux“ — 14 dní + Tištěný průvodce „Těžkost a nadýmání“ — 7 dní + dárek: Kniha „Tajemství zdravého života“",
    'vanoce-pro-dva':          "2 × Balzám Bolotova 500 ml",
    'vanoce-rodina':           "3 × Balzám Bolotova 500 ml + dárek: 1 × Balzám Bolotova 500 ml",
    'vanoce-rodina-kniha':     "4 × Balzám Bolotova 500 ml + dárek: Kniha „Tajemství zdravého života“",
    'vanoce-zimni-zasoba':     "3 × Balzám Bolotova 500 ml + dárek: Balzám Bolotova 250 ml",
    'vanoce-velka-zasoba':     "5 × Balzám Bolotova 500 ml + dárek: Balzám Bolotova 250 ml + kniha „Tajemství zdravého života“",
    'set-black-friday':        "2 × Balzám Bolotova 250 ml + dárek: L-Glutamine Gastric Restore Complex (90 kaps.)"
  },

  /* Discount codes. NOT written here: they come from the canon register
     knowledge-base/finance/promos.json, which is the one place every shop reads, so the same
     code means the same thing in Poland, Czechia and Slovakia. Rebuild after editing the canon:
     php backend/tools/gen-promos.php  —  and verify-catalog.php fails if this copy drifts. */
  /* Pickup points — Zásilkovna in Czechia, Packeta in Slovakia. Two ways to choose one, and
     neither needs an account of ours:
       · the search list, which reads our own copy of the WAREHOUSE's branch catalogue
         (`/api/pickup-points`, generated by backend/tools/gen-pickup-points.php), so the id the
         customer picks is one the warehouse can ship to;
       · the carrier's MAP widget, loaded only when the customer opens it.
     `key` is OPTIONAL: the widget draws its map and returns points with an empty key (that is how
     the live Bitrix shops run it). A real key, from the Packeta client zone, only narrows the map
     to the branches our own contract supports — see shops/czsk/docs/PICKUP-POINTS.md. */
  pickup: {
    key:       '',
    title:     'Výdejní místo',
    hint:      'Zadejte město nebo PSČ a vyberte místo, kde si zásilku vyzvednete.',
    search:    'Město nebo PSČ',
    map:       'Vybrat na mapě',
    change:    'Změnit',
    searching: 'Hledáme…',
    none:      'Nic jsme nenašli. Zkuste jiné město nebo PSČ.',
    more:      'Zobrazujeme prvních {shown} z {total} — upřesněte hledání.',
    required:  'Vyberte výdejní místo.',
    failed:    'Seznam míst se teď nenačetl. Zkuste to prosím znovu.'
  },

  /* ===== PROMOS: GENERATED from knowledge-base/finance/promos.json — DO NOT EDIT ===== */
  /* Rebuild with: php backend/tools/gen-promos.php  (verify-catalog.php checks the copy) */
  promos: {
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
  promoMarket: 'CZ',
  promosAlt: {
    'SK': {
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
  },
  /* ===== /PROMOS ===== */

  /* Lead / review / partner forms (shared/forms.js). `phoneCountry` is the country the
     phone selector opens on — the domain's own, not the buyer's. */
  forms: {
    phoneCountry: 'cz',
    msg: {
      req:        'Vyplňte toto pole.',
      emailEmpty: 'Zadejte e-mailovou adresu.',
      emailBad:   'Neplatná e-mailová adresa (např. jan@example.com).',
      phoneEmpty: 'Zadejte telefonní číslo.',
      phoneBad:   'Neplatné telefonní číslo pro vybranou zemi.',
      consent:    'Zaškrtněte souhlas, abyste mohli pokračovat.'
    },
    thanksLead:        'Děkujeme! ✓',
    thanksLeadText:    'Zkontrolujte schránku — průvodce je na cestě.',
    thanksLeadMail:    'Další tipy vám pošleme e-mailem.',
    thanksReview:      'Děkujeme za hodnocení! ✓',
    thanksReviewText:  'Po schválení se objeví na stránce.',
    thanksInquiry:     'Děkujeme! ✓',
    thanksInquiryText: 'Přijali jsme vaši žádost — brzy se ozveme.',
    thanksBirthday:    'Děkujeme! ✓',
    thanksBirthdayText: 'Datum jsme si uložili. Pokud u nás s tímto e-mailem nakupujete, v den narozenin vám pošleme slevu.',
    withdrawalFailed: 'Formulář se nepodařilo odeslat. Zkuste to prosím znovu nebo napište na info@centerbolotova.eu — lhůta je zachována, pokud odstoupení odešlete před jejím uplynutím.',
    thanksWithdrawal:     'Odstoupení jsme přijali ✓',
    thanksWithdrawalText: 'Potvrzení jsme vám poslali e-mailem. Zboží prosím zašlete do 14 dnů na adresu uvedenou v potvrzení.'
  },

  /* Consent banner (shared/cookies.js). The links point at this storefront's own legal
     pages, which is why the whole sentence lives here rather than in the shared script. */
  cookies: {
    text: 'Používáme soubory cookie, aby stránka fungovala správně a — s vaším souhlasem — abychom měřili návštěvnost a účinnost reklamy (Google Analytics, Meta pixel). Podrobnosti v <a href="zasady-ochrany-osobnich-udaju.html">Zásadách ochrany osobních údajů</a> a <a href="zasady-cookies.html">Zásadách cookies</a>.',
    // Phones (≤ 640 px, owner 2026-10-29): two lines instead of five, so the bar does not hide the order button;
    // the cookie page it links to names every tool and links the privacy policy.
    textShort: 'Cookies pro statistiku a reklamu jen se souhlasem. <a href="zasady-cookies.html">Více</a>',
    essentialOnly: 'Pouze nezbytné',
    acceptAll:     'Přijmout vše'
  },

  t: {
    cardPromo: {
      on:        'Kód {code} je aktivní ({label}) — v košíku zaplatíte',
      omnibus:   'Nejnižší cena za 30 dní před slevou: {price}',
      bundle:    'Kód {code} je aktivní: {label}. Platí, když jsou v košíku všechny položky akce.',
      bundleAdd: 'Přidat vše do košíku — {price}',
      bundleIn:  'Vše už máte v košíku.',
      ladder:    'Kód {code} je aktivní, ale tato cena je už nižší než se slevou — slevy se nesčítají, platíte tu nižší.',
      scope:     'Kód {code} je aktivní ({label}) — na tento produkt se nevztahuje.'
    },
    cartLink:     'Košík',
    close:        'Zavřít',
    added:        'Přidáno do košíku',
    goToCart:     'Přejít do košíku',
    keepShopping: 'Pokračovat v nákupu',
    qtyLabel:     'Množství:',
    inCartLabel:  'v košíku:',
    inCartSum:    'V košíku: {n} ks · {sum}',
    toTop:        'Nahoru',
    promoStarts:  '🎁 Děkujeme, že jste s námi! Váš dárek — sleva {pct} % s kódem {code} — čeká od {from} do {until}.',   // owner 1.11: variant B
    promoStartsBtn: 'OK',
    youSave:      'ušetříte {n}',
    reviewAlt:    'Hodnocení',
    recentTitle:  'Naposledy prohlížené',

    exit: {
      cartTitle:       'Nezapomeňte na svůj košík 🛒',
      cartText:        'Vaše produkty čekají. Dokončete objednávku, nebo nám napište — pomůžeme vybrat produkty a odpovíme na dotazy.',
      backToCart:      'Zpět do košíku',
      writeWa:         'Napište na WhatsApp',
      guideCover:      'assets/img/guide-cover-cz.webp',
      guideCoverAlt:   'Bezplatný průvodce metodou Bolotova',
      guideTitle:      'Počkejte — získejte bezplatného průvodce',
      guideText:       'Nechte nám e-mail a hned si stáhněte BEZPLATNÉHO průvodce systémem Bolotova — jednoduché principy výživy a životního stylu.',
      emailPlaceholder:'Váš e-mail *',
      consent:         'Chci dostávat e-maily Centra Bolotova s tipy a nabídkami. Souhlas mohu kdykoli odvolat odkazem v každém e-mailu.',
      privacy:         'Údaje zpracováváme podle <a href="zasady-ochrany-osobnich-udaju.html" style="color:inherit;text-decoration:underline">zásad ochrany osobních údajů</a>.',
      guidePdf:        'https://drive.google.com/file/d/1ejFKd4Z6V42phypGiLz08jzpzBEAintu/view',
      guidePdfLabel:   'Stáhnout průvodce (PDF)',
      submit:          'Získat průvodce',
      noSpam:          'Žádný spam. Kdykoli se můžete odhlásit.',
      emailBad:        'Neplatná e-mailová adresa (např. jan@example.com).',
      emailEmpty:      'Zadejte e-mailovou adresu.',
      consentRequired: 'Zaškrtněte souhlas, abyste mohli pokračovat.',
      thanksTitle:     'Děkujeme! ✓',
      thanksText:      'Další tipy vám pošleme e-mailem.'
    }
  }
};
