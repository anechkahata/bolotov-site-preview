/* Folds / unfolds the long blocks of a product card (card-acc.css). The page ships folded; a click on button.acc-btn flips
   data-open on its [data-acc] container and aria-expanded on the button. */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.acc-btn') : null;
    if (!b) return;
    var box = b.closest('[data-acc]');
    if (!box) return;
    var open = box.getAttribute('data-open') !== 'true';
    box.setAttribute('data-open', open ? 'true' : 'false');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    var l = b.querySelector('.acc-lbl');
    if (l) l.textContent = open ? b.getAttribute('data-less') : b.getAttribute('data-more');
  });
})();
