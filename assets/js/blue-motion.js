/* Progressive enhancement: content stays visible without JavaScript. */
(function () {
  'use strict';
  function start() {
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var scheduled = false;
    function paint() {
      document.body.classList.toggle('blue-scrolled', window.scrollY > 32);
      scheduled = false;
    }
    function update() {if (!scheduled) {scheduled = true;requestAnimationFrame(paint);}}
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update, {passive:true});
    window.addEventListener('load', update, {once:true});
    paint();
    var productImageSelector = '.catalogue-card__image > img,.drcgf-result-card__image > img,.product-verified__image > img';
    var trackedImages = new WeakSet();
    function updateProductShine(img) {
      var box = img.parentElement;
      var src = img.currentSrc || img.src;
      if (!box || !img.naturalWidth || !img.offsetWidth || img.offsetParent !== box) {
        if (box) box.classList.remove('has-product-shine');
        return;
      }
      box.style.setProperty('--drcgf-image-mask', 'url(' + JSON.stringify(src) + ')');
      box.style.setProperty('--drcgf-image-left', img.offsetLeft + 'px');
      box.style.setProperty('--drcgf-image-top', img.offsetTop + 'px');
      box.style.setProperty('--drcgf-image-width', img.offsetWidth + 'px');
      box.style.setProperty('--drcgf-image-height', img.offsetHeight + 'px');
      box.classList.add('has-product-shine');
    }
    var imageResize = 'ResizeObserver' in window ? new ResizeObserver(function(entries) {
      entries.forEach(function(entry) {
        var target = entry.target;
        var img = target.tagName === 'IMG' ? target : target.querySelector('img');
        if (img) updateProductShine(img);
      });
    }) : null;
    function prepareProductShine() {
      document.querySelectorAll(productImageSelector).forEach(function(img) {
        if (trackedImages.has(img)) return;
        trackedImages.add(img);
        img.addEventListener('load', function() {updateProductShine(img);});
        if (imageResize) {imageResize.observe(img);imageResize.observe(img.parentElement);}
        updateProductShine(img);
      });
    }
    prepareProductShine();
    window.addEventListener('resize', function() {
      document.querySelectorAll(productImageSelector).forEach(updateProductShine);
    }, {passive:true});
    if (!('IntersectionObserver' in window)) return;
    var seen = new WeakSet();
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        if (!motion.matches) entry.target.classList.add('blue-reveal');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.08});
    function observe() {
      document.querySelectorAll('.catalogue-card,.catalogue-title,.tpnb .box,.skb .col-inner>.img,.contact-us .col-inner>.img,.product-verified__image,.info-box,.drcgf-panel').forEach(function(el) {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.classList.contains('catalogue-card')) {
          var siblings = Array.prototype.slice.call(el.parentNode.children);
          el.style.setProperty('--blue-delay', ((siblings.indexOf(el) % 4) * 60) + 'ms');
        }
        observer.observe(el);
      });
    }
    observe();
    // Product search may insert cards after load.
    var main = document.getElementById('main');
    if (main) new MutationObserver(function(mutations) {
      if (mutations.some(function(m) {return m.addedNodes.length > 0;})) {observe();prepareProductShine();}
    }).observe(main, {childList:true,subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
