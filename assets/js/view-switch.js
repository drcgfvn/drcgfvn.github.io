(function () {
  "use strict";
  function mount() {
    if (window.self !== window.top || document.getElementById("drcgf-view-switch")) return;
    var is3D = document.body.dataset.view === "3d";
    if (!document.querySelector('link[href*="view-switch.css"]')) {
      var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/assets/css/view-switch.css?v=4"; document.head.appendChild(link);
    }
    if (!document.getElementById("drcgf-site-tooltip")) {
      var tooltipScript = document.createElement("script"); tooltipScript.src = "/assets/js/site-tooltips.js?v=1"; document.head.appendChild(tooltipScript);
    }
    var nav = document.createElement("nav");
    nav.id = "drcgf-view-switch"; nav.className = "drcgf-view-switch" + (is3D ? " is-showroom" : "");
    nav.setAttribute("aria-label", "Chuyển giao diện website");
    nav.innerHTML = '<a data-site-view="2d" title="Website 2D">2D</a><a data-site-view="3d" title="Không gian 3D">3D</a>';
    function update() {
      var path;
      if (is3D) path = window.DRCGFWindows ? window.DRCGFWindows.currentPage() : new URLSearchParams(location.search).get("page");
      else path = /^\/2d(?:\/(?:index\.html)?)?$/.test(location.pathname) ? null : location.pathname + location.search + location.hash;
      if (path === "/" || path === "/index.html") path = null;
      nav.querySelector('[data-site-view="2d"]').href = path || "/2d/";
      nav.querySelector('[data-site-view="3d"]').href = path ? "/?page=" + encodeURIComponent(path) : "/";
      nav.querySelector('[data-site-view="' + (is3D ? "3d" : "2d") + '"]').setAttribute("aria-current", "page");
    }
    nav.addEventListener("click", function (event) {
      var choice = event.target.closest("a[data-site-view]"); if (!choice) return;
      try { localStorage.setItem("drcgf.preferredView", choice.dataset.siteView); } catch (error) {}
      if (is3D && choice.dataset.siteView === "3d") event.preventDefault();
    });
    update(); window.addEventListener("popstate", update); window.addEventListener("drcgf:pagechange", update);
    document.body.appendChild(nav);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
