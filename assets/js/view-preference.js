(function () {
  "use strict";
  var path = window.location.pathname;
  var is3D = /^\/(?:index\.html)?$/.test(path);
  var is2D = /^\/2d(?:\/(?:index\.html)?)?$/.test(path);
  if (!is3D && !is2D) return;
  var preferred;
  try { preferred = window.localStorage.getItem("drcgf.preferredView"); }
  catch (error) { return; }
  var target = preferred === "2d" && is3D ? "/2d/" : preferred === "3d" && is2D ? "/" : null;
  if (target) window.location.replace(target + window.location.search + window.location.hash);
})();
