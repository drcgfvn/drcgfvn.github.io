(function () {
  "use strict";
  if (document.getElementById("drcgf-site-tooltip")) return;
  var tip = document.createElement("div");
  tip.id = "drcgf-site-tooltip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.appendChild(tip);
  var active = null, savedTitle = null, savedDescription = null, timer = 0;
  var point = null, keyboard = false;
  function hide() {
    clearTimeout(timer); tip.hidden = true;
    if (active) {
      if (savedTitle !== null) active.setAttribute("title", savedTitle);
      if (savedDescription === null) active.removeAttribute("aria-describedby");
      else active.setAttribute("aria-describedby", savedDescription);
    }
    active = null; savedTitle = null; savedDescription = null;
  }
  function position() {
    if (!active || tip.hidden) return;
    var r = active.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var x = keyboard || !point ? r.left + r.width / 2 : point.x;
    var y = keyboard || !point ? r.bottom + 10 : point.y + 19;
    if (y + h > window.innerHeight - 10) y = (keyboard || !point ? r.top : point.y) - h - 12;
    tip.style.left = Math.max(10, Math.min(x - w / 2, window.innerWidth - w - 10)) + "px";
    tip.style.top = Math.max(10, y) + "px";
  }
  function target(node) {
    if (!(node instanceof Element)) return null;
    var el = node.closest('[title], button[aria-label], a[aria-label]');
    // The showroom already provides product tooltips on its canvas and thumbnail strip.
    if (!el || el.closest('#product-strip, #render') || el.disabled) return null;
    if (el.hasAttribute('title') && el.getAttribute('title').trim()) return el;
    return !el.textContent.trim() && el.getAttribute('aria-label') ? el : null;
  }
  function show(el, event, fromKeyboard) {
    if (active === el) return;
    hide(); if (!el) return;
    var text = el.getAttribute('title') || el.getAttribute('aria-label');
    if (!text || !text.trim()) return;
    active = el; savedTitle = el.getAttribute('title');
    savedDescription = el.getAttribute('aria-describedby');
    if (savedTitle !== null) el.removeAttribute('title');
    el.setAttribute('aria-describedby', (savedDescription ? savedDescription + ' ' : '') + tip.id);
    keyboard = fromKeyboard; point = event && !fromKeyboard ? {x:event.clientX,y:event.clientY} : null;
    tip.textContent = text;
    timer = window.setTimeout(function () { if (active) { tip.hidden = false; position(); } }, 220);
  }
  document.addEventListener('pointerover', function (event) {
    if (event.pointerType === 'touch') return;
    if (active && active.contains(event.target)) return;
    show(target(event.target), event, false);
  });
  document.addEventListener('pointermove', function (event) {
    if (!active || keyboard) return;
    point = {x:event.clientX,y:event.clientY}; position();
  });
  document.addEventListener('pointerout', function (event) {
    if (active && !active.contains(event.relatedTarget)) hide();
  });
  document.addEventListener('focusin', function (event) {
    if (event.target.matches && event.target.matches(':focus-visible')) show(target(event.target), null, true);
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  window.addEventListener('blur', hide);
})();
