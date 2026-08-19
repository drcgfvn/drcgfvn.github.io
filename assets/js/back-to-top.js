(function () {
  "use strict";
  function initBackToTop() {
    var link = document.getElementById("top-link");
    if (!link) return;
    function update() {
      if (window.scrollY > 300) link.classList.add("active");
      else link.classList.remove("active");
    }
    link.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
    window.addEventListener("scroll", update, { passive: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBackToTop);
  } else {
    initBackToTop();
  }
})();
