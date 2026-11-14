(function () {
  "use strict";
  function mount() {
    if (document.getElementById("drcgf-view-switch")) return;
    var is3D = document.body.dataset.view === "3d";
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "/assets/css/view-switch.css?v=3";
    if (!document.querySelector('link[href*="view-switch.css"]')) document.head.appendChild(link);
    var tooltipScript = document.createElement("script");
    tooltipScript.src = "/assets/js/site-tooltips.js?v=1";
    document.head.appendChild(tooltipScript);
    // Only the two homepages have both 2D and 3D views.
    var isHomepage = /^(?:\/(?:index\.html)?|\/2d(?:\/(?:index\.html)?)?)$/.test(window.location.pathname);
    if (!isHomepage) return;
    var nav = document.createElement("nav");
    nav.id = "drcgf-view-switch";
    nav.className = "drcgf-view-switch" + (is3D ? " is-showroom" : "");
    nav.setAttribute("aria-label", "Chuyển giao diện website");
    nav.innerHTML = '<a href="/2d/" title="Website 2D"'+(!is3D?' aria-current="page"':'')+'>2D</a><a href="/" title="Showroom 3D"'+(is3D?' aria-current="page"':'')+'>3D</a>';
    document.body.appendChild(nav);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
