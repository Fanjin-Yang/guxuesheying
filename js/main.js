/* =========================================================
   孤雪摄影 Guxue Photography — 交互脚本（原生 JS，无依赖）
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 导航：滚动态 + 移动端菜单 ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.querySelector(".nav__links");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("is-open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { navLinks.classList.remove("is-open"); });
    });
  }

  /* ---------- 首页轮播 ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var dotsWrap = document.getElementById("heroDots");
  var prevBtn = document.getElementById("heroPrev");
  var nextBtn = document.getElementById("heroNext");
  var hero = document.getElementById("home");
  var current = 0;
  var timer = null;
  var INTERVAL = 5000;

  if (slides.length > 0) {
    // 生成圆点
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var d = document.createElement("button");
        d.className = "hero__dot" + (i === 0 ? " is-active" : "");
        d.setAttribute("aria-label", "第 " + (i + 1) + " 张");
        d.addEventListener("click", function () { go(i); restart(); });
        dotsWrap.appendChild(d);
      });
    }
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];

    function go(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === current); });
    }
    function next() { go(current + 1); }
    function prev() { go(current - 1); }
    function start() { timer = setInterval(next, INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    // 悬停暂停
    if (hero) {
      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
    }

    // 触摸滑动
    var startX = 0;
    if (hero) {
      hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
      hero.addEventListener("touchend", function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
        start();
      }, { passive: true });
    }
    // 键盘
    document.addEventListener("keydown", function (e) {
      if (document.querySelector(".lightbox.is-open")) return;
      if (e.key === "ArrowRight") { next(); restart(); }
      if (e.key === "ArrowLeft") { prev(); restart(); }
    });

    start();
  }

  /* ---------- 作品筛选 + 灯箱（gallery 页，数据驱动自动生成） ---------- */
  var grid = document.getElementById("galleryGrid");
  if (grid) {
    // 分类定义：key 对应 images/ 下的文件夹名，label 为显示名
    var GALLERY_CATS = [
      { key: "mood",  label: "心情" },
      { key: "landscape", label: "风景" },
      { key: "travel",    label: "旅行" },
      { key: "night",     label: "夜景" }
    ];
    var GALLERY_MAX = 24; // 单分类最多探测张数，防止异常死循环

    // 生成单个作品条目
    function appendItem(cat, label, n) {
      var item = document.createElement("div");
      item.className = "gallery-item";
      item.setAttribute("data-category", cat);
      item.setAttribute("data-title", label + " · " + n);

      var img = document.createElement("img");
      img.src = "images/" + cat + "/" + n + ".jpg";
      img.alt = label + "作品" + n;
      img.loading = "lazy";
      // 兜底：正常情况下 probe 已确认图存在不会触发；万一缺失则回退占位图，不破图
      img.onerror = function () {
        this.onerror = null;
        this.src = "https://picsum.photos/seed/guxue-" + cat + n + "/800/600";
      };

      var overlay = document.createElement("div");
      overlay.className = "gallery-item__overlay";
      var span = document.createElement("span");
      span.textContent = label + " · " + n;
      overlay.appendChild(span);

      item.appendChild(img);
      item.appendChild(overlay);
      grid.appendChild(item);
    }

    // 探测某分类第 n 张是否存在：存在则追加并继续探测 n+1，缺失则结束该分类
    function probe(cat, label, n, done) {
      if (n > GALLERY_MAX) { done(); return; }
      var test = new Image();
      test.onload = function () { appendItem(cat, label, n); probe(cat, label, n + 1, done); };
      test.onerror = function () { done(); };
      test.src = "images/" + cat + "/" + n + ".jpg";
    }

    // 全部分类探测完成后，再绑定筛选与灯箱
    var pending = GALLERY_CATS.length;
    function maybeInit() { if (--pending === 0) initGallery(); }

    function initGallery() {
      var items = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));
      var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));

      function applyFilter(cat) {
        items.forEach(function (it) {
          var match = cat === "all" || it.getAttribute("data-category") === cat;
          it.classList.toggle("is-hidden", !match);
        });
        filterBtns.forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-filter") === cat);
        });
      }

      filterBtns.forEach(function (b) {
        b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter")); });
      });

      // 支持 ?cat=mood 直达筛选
      var params = new URLSearchParams(window.location.search);
      var catParam = params.get("cat");
      if (catParam) applyFilter(catParam);

      /* 灯箱 */
      var lightbox = document.getElementById("lightbox");
      var lbImg = document.getElementById("lightboxImg");
      var lbCap = document.getElementById("lightboxCaption");
      var lbClose = document.getElementById("lightboxClose");
      var lbPrev = document.getElementById("lightboxPrev");
      var lbNext = document.getElementById("lightboxNext");
      var visible = [];
      var lbIndex = 0;

      function refreshVisible() {
        visible = items.filter(function (it) { return !it.classList.contains("is-hidden"); });
      }
      function showLb(i) {
        lbIndex = (i + visible.length) % visible.length;
        var el = visible[lbIndex];
        var img = el.querySelector("img");
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || "";
        lbCap.textContent = el.getAttribute("data-title") || "";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
      function closeLb() {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
      }

      items.forEach(function (it) {
        it.addEventListener("click", function () {
          refreshVisible();
          var idx = visible.indexOf(it);
          if (idx > -1) showLb(idx);
        });
      });
      if (lbClose) lbClose.addEventListener("click", closeLb);
      if (lbNext) lbNext.addEventListener("click", function () { showLb(lbIndex + 1); });
      if (lbPrev) lbPrev.addEventListener("click", function () { showLb(lbIndex - 1); });
      if (lightbox) lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
      document.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") showLb(lbIndex + 1);
        if (e.key === "ArrowLeft") showLb(lbIndex - 1);
      });
    }

    GALLERY_CATS.forEach(function (c) { probe(c.key, c.label, 1, maybeInit); });
  }

  /* ---------- 滚动渐显 ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("is-visible"); });
  }
})();
