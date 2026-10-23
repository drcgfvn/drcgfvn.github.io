/* Preserve outgoing zoom for the full crossfade; no per-frame DOM mutations. */
(function () {
  'use strict';
  function init() {
    var wrapper = document.getElementById('slider-247421510');
    if (!wrapper || wrapper.__smoothHeroZoom) return;
    var slider = wrapper.querySelector('.slider');
    if (!slider) return;
    var slides = Array.prototype.filter.call(slider.querySelectorAll('.img'), function (slide) {
      return !!slide.querySelector('.drcgf-slide-desktop');
    });
    if (!slides.length) return;
    wrapper.__smoothHeroZoom = true;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = window.matchMedia('(min-width: 550px) and (hover: hover) and (pointer: fine)');
    var records = slides.map(function (slide) {
      return {slide:slide, image:slide.querySelector('.drcgf-slide-desktop'), animation:null, timer:null};
    });
    function cancel(record) {
      if (record.timer !== null) window.clearTimeout(record.timer);
      record.timer = null;
      if (record.animation) record.animation.cancel();
      record.animation = null;
    }
    function sync() {
      var anySelected = slides.some(function (slide) {return slide.classList.contains('is-selected');});
      records.forEach(function (record, index) {
        if (reduced.matches || !desktop.matches || typeof record.image.animate !== 'function') {
          cancel(record); return;
        }
        var selected = record.slide.classList.contains('is-selected') || (!anySelected && index === 0);
        if (selected) {
          if (record.timer !== null) window.clearTimeout(record.timer);
          record.timer = null;
          // Reselecting during a fade keeps the current scale; it never restarts at 1.
          if (!record.animation) {
            record.animation = record.image.animate([
              {transform:'scale(1)'}, {transform:'scale(1.035)'}
            ], {duration:6500, easing:'linear', fill:'forwards'});
          }
        } else if (record.animation && record.timer === null) {
          // Existing crossfade is 800ms. Reset only after the outgoing image is invisible.
          record.timer = window.setTimeout(function () {
            record.timer = null;
            if (!record.slide.classList.contains('is-selected')) cancel(record);
          }, 1100);
        }
      });
    }
    var observer = new MutationObserver(sync);
    records.forEach(function (record) {
      observer.observe(record.slide, {attributes:true, attributeFilter:['class']});
    });
    function listen(media) {
      if (media.addEventListener) media.addEventListener('change', sync);
      else if (media.addListener) media.addListener(sync);
    }
    listen(reduced); listen(desktop);
    window.addEventListener('pagehide', function () {records.forEach(cancel);});
    window.addEventListener('pageshow', sync);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
