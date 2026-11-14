(function () {
  "use strict";
  var allowed = /^\/(?:gioi-thieu|thuong-hieu|san-pham|danh-muc-san-pham|thanh-phan|category|tin-tuc|lien-he|tai-lieu-drcgf|chuyen-khoan|chinh-sach-bao-mat|tim-kiem|cam-on|thu-moi-mai-kami-06-10)(?:\/|$)/;
  var current = null, frame = null, serial = 0, opener = null, homeTitle = document.title;
  function pageURL(value, base) {
    try {
      var url = new URL(value, base || location.origin);
      if (url.origin !== location.origin || !allowed.test(url.pathname) || !/(?:\/|\.html)$/.test(url.pathname)) return null;
      url.searchParams.delete("embed3d");
      // Cloudflare canonicalizes index.html to directory URLs; normalize before history updates.
      url.pathname=url.pathname.replace(/\/index\.html$/, "/");
      return url;
    } catch (error) { return null; }
  }
  function route(url) { return url.pathname + url.search + url.hash; }
  var catalogShell=document.getElementById("catalog");
  var dialog = document.createElement("div"); dialog.id = "site-window";dialog.hidden=true;dialog.setAttribute("role","region");
  dialog.setAttribute("aria-labelledby", "site-window-title");
  dialog.innerHTML = '<header class="sw-header"><div class="sw-heading"><span class="sw-eyebrow">DR.CGF / KHÔNG GIAN 3D</span><h2 id="site-window-title">Đang mở nội dung…</h2></div><div class="sw-actions"><button id="sw-back" type="button" title="Quay lại mục trước" aria-label="Quay lại mục trước"><svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg></button><button id="sw-close" type="button" aria-label="Đóng cửa sổ nội dung" title="Đóng cửa sổ"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div></header><div class="sw-body"><div class="sw-status" role="status" aria-live="polite"><span class="sw-spinner" aria-hidden="true"></span><span>Đang mở nội dung…</span></div><div class="sw-frame-host"></div></div>';
  catalogShell.appendChild(dialog);
  var title = dialog.querySelector("#site-window-title"), status = dialog.querySelector(".sw-status"), host = dialog.querySelector(".sw-frame-host"), back = dialog.querySelector("#sw-back");
  function announce() { window.dispatchEvent(new CustomEvent("drcgf:pagechange", {detail:{page:current}})); }
  function hide() {
    serial++; current = null;
    if (frame) { frame.remove(); frame = null; }
    dialog.hidden=true;
    catalogShell.classList.remove("has-content");catalogShell.hidden=true;catalogShell.style.removeProperty("height");catalogShell.setAttribute("aria-label","Sản phẩm");
    var listButton=document.getElementById("list-toggle");if(listButton)listButton.setAttribute("aria-expanded","false");
    document.body.classList.remove("site-window-open"); document.title = homeTitle; announce();
    if (opener && opener.isConnected) opener.focus({preventScroll:true});
  }
  function close() { if (dialog.hidden) return; history.pushState({drcgfPage:null,depth:0}, "", "/"); hide(); }
  function updateHeader(url) {
    back.disabled = !history.state || !history.state.depth;
  }
  function loading() { status.hidden = false; status.innerHTML = '<span class="sw-spinner" aria-hidden="true"></span><span>Đang mở nội dung…</span>'; }
  function fail(message) {
    status.hidden = false; status.textContent = message;
    var a = document.createElement("a"); a.href = current || "/2d/"; a.textContent = "Mở bằng giao diện 2D"; a.className = "sw-fallback";
    a.addEventListener("click", function () { try { localStorage.setItem("drcgf.preferredView", "2d"); } catch (error) {} }); status.appendChild(a);
  }
  function bindFrame(activeFrame, token) {
    var loadTimer=window.setTimeout(function(){if(token===serial && !activeFrame.classList.contains("is-ready"))fail("Nội dung tải hơi lâu. Bạn có thể thử mở bằng giao diện 2D.");},20000);
    activeFrame.addEventListener("load", function () {
      if (token !== serial) return;
      var doc, url;
      try { doc = activeFrame.contentDocument; url = pageURL(activeFrame.contentWindow.location.href); } catch (error) { fail("Không thể mở nội dung này trong cửa sổ."); return; }
      if (!doc || !url || !doc.querySelector("#main,main,#content")) { fail("Nội dung chưa sẵn sàng. Bạn có thể mở bằng giao diện 2D."); return; }
      var loaded = route(url);
      if (loaded !== current) { current = loaded; history.pushState({drcgfPage:current,depth:((history.state && history.state.depth)||0)+1}, "", "/?page=" + encodeURIComponent(current)); updateHeader(url); announce(); }
      function notificationPreviews() {
        doc.querySelectorAll('a[href*="phieu-cong-bo/"][href*=".pdf"]').forEach(function(a){
          var name="";
          try { name=decodeURIComponent(a.getAttribute("href")).toUpperCase(); } catch(error) {}
          var product=typeof products !== "undefined" && products.find(function(p){return name.indexOf("DR.CGF "+p.line.toUpperCase())>=0;});
          if(product && product.notificationImage){
            a.href=new URL(product.notificationImage,location.origin).href;
            a.textContent="Xem trang đầu phiếu công bố";a.target="_blank";a.rel="noopener";a.removeAttribute("download");
          }else a.remove();
        });
      }
      notificationPreviews();
      var content=doc.querySelector("#main,main,#content");
      // Page-wide 2D shell styling is redundant inside the catalogue drawer.
      content.classList.remove("drcgf-page-shell");
      new MutationObserver(notificationPreviews).observe(content,{childList:true,subtree:true});
      doc.documentElement.dataset.siteWindow = "true";
      var css = doc.createElement("link"); css.rel = "stylesheet"; css.href = "/assets/css/showroom-window-content.css?v=4";
      function ready() {
        if (token !== serial) return;
        clearTimeout(loadTimer);
        var h = content.querySelector("h1,.section-title-main,.entry-title,.catalogue-title h2"), text = (h && h.textContent.trim()) || doc.title.replace(/\s*[|–-]\s*DR\.CGF.*$/i, "");
        if(h){var headingBlock=h.closest(".section-title-container,.catalogue-title") || h;headingBlock.setAttribute("data-sw-duplicate-heading", "true");}
        title.textContent = text || "DR.CGF"; activeFrame.removeAttribute("title"); activeFrame.setAttribute("aria-label",title.textContent); document.title = title.textContent + " | DR.CGF 3D";
        content.scrollTop=0; status.hidden = true; activeFrame.classList.add("is-ready");
      }
      var existingStyle=doc.getElementById("drcgf-window-content-style");
      if(existingStyle && existingStyle.href===css.href) ready();
      else {
        css.id="drcgf-window-content-style";
        css.addEventListener("load",function(){if(existingStyle)existingStyle.remove();ready();},{once:true});
        css.addEventListener("error",function(){fail("Không tải được giao diện nội dung. Vui lòng thử lại.");},{once:true});
        doc.head.appendChild(css);
      }
      doc.addEventListener("click", function (event) {
        var a = event.target.closest && event.target.closest("a[href]");
        if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.hasAttribute("download") || a.target === "_blank") return;
        var dest;
        try { dest = new URL(a.getAttribute("href"), doc.baseURI); } catch(error) { return; }
        if (dest.origin === location.origin && /^\/(?:index\.html)?$/.test(dest.pathname) && !dest.hash) { event.preventDefault(); close(); return; }
        var next = pageURL(dest.href);
        if (!next || (next.pathname === url.pathname && next.search === url.search && next.hash)) return;
        event.preventDefault(); open(next.href, true);
      }, true);
      doc.addEventListener("submit",function(event){
        var form=event.target;
        if(event.defaultPrevented || form.method.toLowerCase()!=="get" || form.target==="_blank")return;
        var dest=pageURL(form.action || url.href);if(!dest)return;
        dest.search="";
        new FormData(form).forEach(function(value,key){if(typeof value==="string")dest.searchParams.set(key,value);});
        event.preventDefault();open(dest.href,true);
      },true);
      doc.addEventListener("keydown", function (event) { if (event.key === "Escape") { event.preventDefault(); close(); } });

    });
  }
  function open(value, push) {
    var url = pageURL(value); if (!url) return false;
    var next = route(url);
    if (next === current && !dialog.hidden) return true;
    current = next; var token = ++serial;
    if (push) history.pushState({drcgfPage:current,depth:((history.state && history.state.depth)||0)+1}, "", "/?page=" + encodeURIComponent(current));
    updateHeader(url); loading(); title.textContent = "Đang mở nội dung…";
    if (dialog.hidden) {
      opener = document.activeElement;
      if(typeof stopAutoTour === "function") stopAutoTour();
      var menu=document.querySelector("#sm3-nav"), menuToggle=document.querySelector("#sm3-toggle");
      if(menu){menu.classList.remove("is-open");menu.querySelectorAll("details[open]").forEach(function(d){d.open=false;});}
      if(menuToggle){menuToggle.setAttribute("aria-expanded","false");menuToggle.setAttribute("aria-label","Mở menu website");}
      catalogShell.classList.add("has-content");dialog.hidden=false;catalogShell.hidden=false;
      catalogShell.setAttribute("aria-label","Nội dung DR.CGF");
      document.getElementById("list-toggle").setAttribute("aria-expanded","true");
      document.body.classList.add("site-window-open");
    }
    fitPanel();
    if (frame) frame.remove();
    frame = document.createElement("iframe"); frame.setAttribute("aria-label","Nội dung DR.CGF"); frame.name = "drcgf-content-window";
    frame.setAttribute("referrerpolicy", "same-origin"); frame.setAttribute("scrolling","no"); bindFrame(frame, token);
    url.searchParams.set("embed3d", "1"); frame.src = url.href; host.appendChild(frame);
    announce(); return true;
  }
  dialog.querySelector("#sw-close").addEventListener("click", close);
  back.addEventListener("click", function () { if (!back.disabled) history.back(); });
  function fitPanel(){if(!dialog.hidden)catalogShell.style.height=getComputedStyle(catalogShell).maxHeight;}
  window.addEventListener("resize",fitPanel);
  document.addEventListener("keydown",function(event){if(event.key==="Escape" && !dialog.hidden){event.preventDefault();event.stopImmediatePropagation();close();}},true);
  document.addEventListener("click", function (event) {
    var a = event.target.closest && event.target.closest("#sm3-nav a[href], .sw-tabs a[href]");
    if (!a || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || a.target === "_blank") return;
    if (open(a.href, true)) event.preventDefault();
  });
  document.addEventListener("submit",function(event){
    var form=event.target;
    if(!form.matches("#sm3-nav form"))return;
    var url=new URL(form.action,location.origin);
    new FormData(form).forEach(function(value,key){if(typeof value==="string")url.searchParams.set(key,value);});
    if(open(url.href,true))event.preventDefault();
  });
  function sync() { var page = new URLSearchParams(location.search).get("page"); if (page && pageURL(page)) open(page, false); else hide(); }
  window.addEventListener("popstate", sync);
  window.DRCGFWindows = {open:function(value){return open(value,true);},close:close,currentPage:function(){return current;}};
  sync();
})();
