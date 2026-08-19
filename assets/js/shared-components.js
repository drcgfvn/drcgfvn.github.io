(function () {
  "use strict";

  var loaderScript = document.currentScript;
  var siteRoot = new URL("../../", loaderScript.src);
  var mobileMedia = window.matchMedia("(max-width: 884px)");

  ensureStylesheet("drcgf-site-enhancements", "assets/css/site-enhancements.css?v=20260729-menu885");

  function ensureStylesheet(id, relativePath) {
    if (document.getElementById(id)) return;

    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = new URL(relativePath, siteRoot).href;
    (document.head || document.documentElement).appendChild(link);
  }

  function scheduleMobileSetup() {
    window.setTimeout(setupMobileControls, 0);
    window.setTimeout(setupMobileControls, 500);
  }

  function setupSharedBackToTop() {
    var link = document.getElementById("top-link");
    if (!link || link.__drcgfSharedBound) return;
    link.__drcgfSharedBound = true;

    function update() {
      link.classList.toggle("active", window.scrollY > 300);
    }

    link.addEventListener("click", function (event) {
      event.preventDefault();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch (error) {
        window.scrollTo(0, 0);
      }
    });
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  window.loadSharedComponent = function (componentName, target) {
    var slots = [];
    if (target) {
      slots = [target];
    } else {
      slots = Array.prototype.slice.call(
        document.querySelectorAll('[data-shared-component="' + componentName + '"]')
      );
    }
    if (!slots.length) return Promise.resolve();

    var componentUrl = new URL("components/" + componentName + ".html", siteRoot);
    return fetch(componentUrl.href, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) {
        var resolvedHtml = html.replace(/\{\{ROOT\}\}/g, siteRoot.href);
        slots.forEach(function (slot) {
          slot.insertAdjacentHTML("beforebegin", resolvedHtml);
          slot.remove();
        });

        if (componentName === "menumain") scheduleMobileSetup();
        if (componentName === "footermain") {
          setupSharedBackToTop();
          syncMobileBackToTop();
        }
      })
      .catch(function (error) {
        console.error("Không tải được component " + componentName + ":", error);
        slots.forEach(function (slot) {
          slot.setAttribute("data-shared-error", "true");
        });
      });
  };

  function loadDeclaredSharedComponents() {
    var slots = document.querySelectorAll("[data-shared-component]");
    Array.prototype.forEach.call(slots, function (slot) {
      if (slot.getAttribute("data-shared-loaded") === "true") return;
      var name = slot.getAttribute("data-shared-component");
      if (name) window.loadSharedComponent(name, slot);
    });
  }

  function getMenuTrigger() {
    return document.querySelector('a[data-open="#main-menu"]');
  }

  function getSearchTrigger() {
    return document.querySelector('a[data-open="#search-lightbox"]');
  }

  function getBackdrop() {
    var backdrop = document.getElementById("drcgf-mobile-backdrop");
    if (!backdrop && document.body) {
      backdrop = document.createElement("button");
      backdrop.id = "drcgf-mobile-backdrop";
      backdrop.className = "drcgf-mobile-backdrop";
      backdrop.type = "button";
      backdrop.setAttribute("aria-label", "Đóng cửa sổ");
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function makeCloseButton(label, className) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.innerHTML = '<span aria-hidden="true">&times;</span>';
    return button;
  }

  function removeThemeSubmenuToggles(menu) {
    if (!menu) return;
    var themeToggles = menu.querySelectorAll("button.toggle");
    Array.prototype.forEach.call(themeToggles, function (button) {
      button.remove();
    });
  }

  function observeThemeSubmenuToggles(menu) {
    if (!menu || menu.__drcgfToggleObserver) return;
    var observer = new MutationObserver(function () {
      removeThemeSubmenuToggles(menu);
    });
    observer.observe(menu, { childList: true, subtree: true });
    menu.__drcgfToggleObserver = observer;
  }

  function setupGlobalFixedHeader() {
    var header = document.getElementById("header");
    if (!header || !document.body) return;

    header.classList.remove(
      "has-sticky",
      "sticky-jump",
      "sticky-hide-on-scroll",
      "sticky-hide-on-scroll--active",
      "show-on-scroll",
      "stuck",
      "is-sticky"
    );
    header.classList.add("drcgf-fixed-header");

    var wrapper = header.querySelector(".header-wrapper");
    if (wrapper) {
      wrapper.classList.remove("stuck");
      ["position", "top", "left", "right", "bottom", "transform", "-webkit-transform", "animation"].forEach(function (property) {
        wrapper.style.removeProperty(property);
      });
    }

    var spacer = document.getElementById("drcgf-fixed-header-space");
    if (!spacer && header.parentNode) {
      spacer = document.createElement("div");
      spacer.id = "drcgf-fixed-header-space";
      spacer.setAttribute("aria-hidden", "true");
      header.parentNode.insertBefore(spacer, header);
    }

    if (header.parentElement !== document.body) document.body.appendChild(header);

    function updateHeaderSpace() {
      if (!spacer || !header) return;
      var height = Math.ceil(header.getBoundingClientRect().height || (mobileMedia.matches ? 70 : 0));
      if (mobileMedia.matches) height = 70;
      spacer.style.height = height + "px";
      spacer.style.minHeight = height + "px";
      document.documentElement.style.setProperty("--drcgf-header-height", height + "px");
    }

    updateHeaderSpace();
    window.setTimeout(updateHeaderSpace, 50);
    window.setTimeout(updateHeaderSpace, 400);

    if (!header.__drcgfResizeBound) {
      window.addEventListener("resize", updateHeaderSpace, { passive: true });
      if (window.ResizeObserver) {
        header.__drcgfResizeObserver = new ResizeObserver(updateHeaderSpace);
        header.__drcgfResizeObserver.observe(header);
      }
      header.__drcgfResizeBound = true;
    }
  }

  function normalizeMobileHeader() {
    setupGlobalFixedHeader();
  }

  function restoreDesktopHeader() {
    setupGlobalFixedHeader();
  }

  function observeMobileHeader() {
    /* Không dùng observer/sticky theo hướng cuộn. Header luôn fixed ngay từ đầu. */
  }

  function setupMobileControls() {
    var menu = document.getElementById("main-menu");
    var search = document.getElementById("search-lightbox");
    if (!menu || !search || !document.body) return;

    /* Đưa hai lớp phủ ra thẳng body để sticky header/transform của theme
       không làm lệch hoặc cắt panel trên điện thoại. */
    if (menu.parentElement !== document.body) document.body.appendChild(menu);
    if (search.parentElement !== document.body) document.body.appendChild(search);
    getBackdrop();

    setupGlobalFixedHeader();
    removeThemeSubmenuToggles(menu);
    observeThemeSubmenuToggles(menu);

    var sidebar = menu.querySelector(".sidebar-menu");
    if (sidebar && !sidebar.querySelector(".drcgf-mobile-menu-close")) {
      sidebar.insertBefore(
        makeCloseButton("Đóng menu", "drcgf-mobile-close drcgf-mobile-menu-close"),
        sidebar.firstChild
      );
    }

    if (!search.querySelector(".drcgf-mobile-search-close")) {
      search.insertBefore(
        makeCloseButton("Đóng tìm kiếm", "drcgf-mobile-close drcgf-mobile-search-close"),
        search.firstChild
      );
    }

    var parents = menu.querySelectorAll("li.menu-item-has-children");
    Array.prototype.forEach.call(parents, function (item) {
      if (item.querySelector(":scope > .drcgf-submenu-toggle")) return;
      var submenu = item.querySelector(":scope > .sub-menu, :scope > ul.children");
      var link = item.querySelector(":scope > a");
      if (!submenu || !link) return;

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "drcgf-submenu-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Mở menu con " + link.textContent.trim());
      toggle.innerHTML = '<span aria-hidden="true"></span>';
      item.insertBefore(toggle, submenu);
    });
  }

  function openMenu() {
    if (!mobileMedia.matches) return;
    setupMobileControls();
    closeSearch(false);

    var menu = document.getElementById("main-menu");
    var trigger = getMenuTrigger();
    if (!menu) return;

    menu.classList.add("drcgf-mobile-panel-open");
    document.body.classList.add("drcgf-mobile-menu-active");
    document.body.classList.remove("drcgf-mobile-search-active");
    if (trigger) trigger.setAttribute("aria-expanded", "true");

    // Không tự động focus vào ô tìm kiếm hoặc nút đóng khi mở menu.
    // Bỏ focus khỏi nút vừa bấm để giao diện không hiện trạng thái chọn.
    window.setTimeout(function () {
      var active = document.activeElement;
      if (active && typeof active.blur === "function") active.blur();
    }, 0);
  }

  function closeMenu(restoreFocus) {
    var menu = document.getElementById("main-menu");
    var trigger = getMenuTrigger();
    if (menu) menu.classList.remove("drcgf-mobile-panel-open");
    if (document.body) document.body.classList.remove("drcgf-mobile-menu-active");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus && trigger) trigger.focus();
  }

  function openSearch() {
    if (!mobileMedia.matches) return;
    setupMobileControls();
    closeMenu(false);

    var search = document.getElementById("search-lightbox");
    var trigger = getSearchTrigger();
    if (!search) return;

    search.classList.add("drcgf-mobile-panel-open");
    document.body.classList.add("drcgf-mobile-search-active");
    document.body.classList.remove("drcgf-mobile-menu-active");
    if (trigger) trigger.setAttribute("aria-expanded", "true");

    var field = search.querySelector("input.search-field");
    if (field) window.setTimeout(function () { field.focus(); }, 40);
  }

  function closeSearch(restoreFocus) {
    var search = document.getElementById("search-lightbox");
    var trigger = getSearchTrigger();
    if (search) search.classList.remove("drcgf-mobile-panel-open");
    if (document.body) document.body.classList.remove("drcgf-mobile-search-active");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus && trigger) trigger.focus();
  }

  document.addEventListener("click", function (event) {
    if (!mobileMedia.matches) return;

    var menuButton = event.target.closest('a[data-open="#main-menu"]');
    if (menuButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openMenu();
      if (typeof menuButton.blur === "function") menuButton.blur();
      return;
    }

    var searchButton = event.target.closest('a[data-open="#search-lightbox"]');
    if (searchButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSearch();
      return;
    }

    if (event.target.closest(".drcgf-mobile-menu-close")) {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.target.closest(".drcgf-mobile-search-close")) {
      event.preventDefault();
      closeSearch(true);
      return;
    }

    if (event.target.closest("#drcgf-mobile-backdrop")) {
      event.preventDefault();
      closeMenu(false);
      closeSearch(false);
      return;
    }

    var submenuButton = event.target.closest(".drcgf-submenu-toggle");
    if (submenuButton) {
      event.preventDefault();
      var item = submenuButton.parentElement;
      var isOpen = item.classList.toggle("drcgf-submenu-open");
      submenuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
  }, true);

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("#main-menu form.searchform, #search-lightbox form.searchform");
    if (!form) return;
    var input = form.querySelector('input[name="q"]');
    if (input && !input.value.trim()) {
      event.preventDefault();
      input.focus();
    }
  });


  var lastTopActivation = 0;

  function runMobileBackToTop(event) {
    if (!mobileMedia.matches) return;
    var target = event.target;
    var topLink = target && target.closest ? target.closest("#top-link.back-to-top") : null;
    if (!topLink) return;

    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

    var now = Date.now();
    if (now - lastTopActivation < 450) return;
    lastTopActivation = now;

    if (typeof topLink.blur === "function") topLink.blur();

    try {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    // Safari iOS đôi khi dừng smooth-scroll khi thanh địa chỉ thay đổi kích thước.
    // Fallback này bảo đảm một lần chạm luôn về đầu trang.
    window.setTimeout(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y > 2) window.scrollTo(0, 0);
      syncMobileBackToTop();
      if (typeof topLink.blur === "function") topLink.blur();
    }, 650);
  }

  document.addEventListener("touchend", runMobileBackToTop, { capture: true, passive: false });
  document.addEventListener("click", runMobileBackToTop, true);

  function syncMobileBackToTop() {
    if (!mobileMedia.matches) return;
    var topLink = document.getElementById("top-link");
    if (!topLink) return;
    var shouldShow = (window.pageYOffset || document.documentElement.scrollTop || 0) > 180;
    topLink.classList.toggle("active", shouldShow);
    topLink.classList.toggle("drcgf-top-visible", shouldShow);
    topLink.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (!shouldShow && typeof topLink.blur === "function") topLink.blur();
  }

  var topButtonFrame = 0;
  window.addEventListener("scroll", function () {
    if (!mobileMedia.matches || topButtonFrame) return;
    topButtonFrame = window.requestAnimationFrame(function () {
      topButtonFrame = 0;
      syncMobileBackToTop();
    });
  }, { passive: true });

  window.addEventListener("load", syncMobileBackToTop);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncMobileBackToTop);
  } else {
    syncMobileBackToTop();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (document.body && document.body.classList.contains("drcgf-mobile-menu-active")) {
      closeMenu(true);
    } else if (document.body && document.body.classList.contains("drcgf-mobile-search-active")) {
      closeSearch(true);
    }
  });

  function closePanelsOnDesktop() {
    if (!mobileMedia.matches) {
      closeMenu(false);
      closeSearch(false);
    }
    setupGlobalFixedHeader();
  }

  if (mobileMedia.addEventListener) {
    mobileMedia.addEventListener("change", closePanelsOnDesktop);
  } else if (mobileMedia.addListener) {
    mobileMedia.addListener(closePanelsOnDesktop);
  }

  window.addEventListener("load", function () {
    setupMobileControls();
    setupGlobalFixedHeader();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      loadDeclaredSharedComponents();
      setupMobileControls();
      setupGlobalFixedHeader();
    });
  } else {
    loadDeclaredSharedComponents();
    setupMobileControls();
    setupGlobalFixedHeader();
  }
})();
