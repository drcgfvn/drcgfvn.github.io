(function () {
  "use strict";
  if (window.self !== window.top) {
    document.documentElement.dataset.siteWindow = "true";
    var style = document.createElement("link"); style.id = "drcgf-window-content-style";
    style.rel = "stylesheet"; style.href = "/assets/css/showroom-window-content.css?v=3";
    var critical=document.createElement("style");critical.textContent="html,body{height:100%!important;overflow:hidden!important}body{visibility:hidden}html[data-site-window] body #main{visibility:visible}";document.head.appendChild(critical);
    document.head.appendChild(style);
    return;
  }
  var path = window.location.pathname, preferred;
  var is3D = /^\/(?:index\.html)?$/.test(path);
  var is2DHome = /^\/2d(?:\/(?:index\.html)?)?$/.test(path);
  var content = /^\/(?:gioi-thieu|thuong-hieu|san-pham|danh-muc-san-pham|thanh-phan|category|tin-tuc|lien-he|tai-lieu-drcgf|chuyen-khoan|chinh-sach-bao-mat|tim-kiem|cam-on|thu-moi-mai-kami-06-10)(?:\/|$)/.test(path);
  try { preferred = window.localStorage.getItem("drcgf.preferredView"); } catch (error) { return; }
  if (preferred === "2d" && is3D) {
    var page = new URLSearchParams(window.location.search).get("page"), target = "/2d/";
    if (page) {
      try {
        var url = new URL(page, window.location.origin);
        if (url.origin === window.location.origin && /^\/(?:gioi-thieu|thuong-hieu|san-pham|danh-muc-san-pham|thanh-phan|category|tin-tuc|lien-he|tai-lieu-drcgf|chuyen-khoan|chinh-sach-bao-mat|tim-kiem|cam-on|thu-moi-mai-kami-06-10)(?:\/|$)/.test(url.pathname) && /(?:\/|\.html)$/.test(url.pathname)) target = url.pathname + url.search + url.hash;
      } catch (error) { /* An invalid route falls back to the 2D homepage. */ }
    } else target += window.location.search + window.location.hash;
    window.location.replace(target);
  } else if (preferred === "3d" && (is2DHome || content)) {
    window.location.replace(content ? "/?page=" + encodeURIComponent(path + window.location.search + window.location.hash) : "/" + window.location.search + window.location.hash);
  }
})();
