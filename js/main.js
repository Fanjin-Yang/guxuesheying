/* Guxue Photography — native, dependency-free interactions. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav__links');
  const isGallery = document.body.classList.contains('gallery-page');
  const scrollNav = () => nav?.classList.toggle('is-scrolled', isGallery || window.scrollY > 40);
  window.addEventListener('scroll', scrollNav, { passive: true });
  scrollNav();
  function menu(open) {
    links?.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  }
  toggle?.addEventListener('click', () => menu(!links.classList.contains('is-open')));
  links?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && links?.classList.contains('is-open')) { menu(false); toggle.focus(); } });

  const slides = [...document.querySelectorAll('.hero__slide')];
  if (slides.length) {
    let current = 0, timer;
    const hero = document.getElementById('home');
    const dots = document.getElementById('heroDots');
    const pause = document.getElementById('heroPause');
    let paused = reduced.matches;
    const stop = () => clearInterval(timer);
    const start = () => { stop(); if (!paused && !reduced.matches && !document.hidden) timer = setInterval(() => go(current + 1), 6500); };
    function go(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      [...dots.children].forEach((d, i) => { d.classList.toggle('is-active', i === current); d.setAttribute('aria-pressed', String(i === current)); });
    }
    slides.forEach((_, i) => { const b = document.createElement('button'); b.className = 'hero__dot'; b.setAttribute('aria-label', `第 ${i + 1} 张`); b.addEventListener('click', () => { go(i); start(); }); dots.append(b); });
    document.getElementById('heroPrev')?.addEventListener('click', () => { go(current - 1); start(); });
    document.getElementById('heroNext')?.addEventListener('click', () => { go(current + 1); start(); });
    pause?.addEventListener('click', () => { paused = !paused; pause.textContent = paused ? '播放轮播 ▷' : '暂停轮播 Ⅱ'; pause.setAttribute('aria-pressed', String(paused)); start(); });
    if (pause) { pause.textContent = paused ? '播放轮播 ▷' : '暂停轮播 Ⅱ'; pause.setAttribute('aria-pressed', String(paused)); }
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    let heroTouch = null;
    hero.addEventListener('touchstart', e => { heroTouch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; stop(); }, { passive: true });
    hero.addEventListener('touchend', e => {
      if (heroTouch) {
        const dx = e.changedTouches[0].clientX - heroTouch.x, dy = e.changedTouches[0].clientY - heroTouch.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
      }
      heroTouch = null; start();
    }, { passive: true });
    document.addEventListener('visibilitychange', start);
    reduced.addEventListener('change', start);
    go(0); start();
  }

  const grid = document.getElementById('galleryGrid');
  if (grid) {
    const photos = window.GUXUE_PHOTOS || [];
    const categories = ['mood', 'landscape', 'travel', 'night'];
    const names = { mood: '心情 / MOOD', landscape: '风景 / LANDSCAPE', travel: '旅行 / TRAVEL', night: '夜景 / NIGHT' };
    // Interleave collections to give the complete exhibition a varied visual rhythm.
    const grouped = categories.map(c => photos.filter(p => p.category === c));
    const ordered = [];
    for (let i = 0; i < Math.max(0, ...grouped.map(g => g.length)); i++) grouped.forEach(g => { if (g[i]) ordered.push(g[i]); });
    const buttons = [...document.querySelectorAll('.filter-btn')];
    let visible = [], active = 'all', index = 0, opener, request = 0, zoomed = false, savedOverflow = '';
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const stage = document.getElementById('lightboxStage');
    const status = document.getElementById('lightboxStatus');
    const close = document.getElementById('lightboxClose');
    const zoom = document.getElementById('lightboxZoom');
    const background = [...document.body.children].filter(el => el !== box && !['SCRIPT', 'LINK'].includes(el.tagName));
    const pad = n => String(n).padStart(2, '0');
    const animate = (el, frames, duration = 550) => { if (!reduced.matches) return el.animate(frames, { duration, easing: 'cubic-bezier(.22,.68,.2,1)', fill: 'none' }); };
    buttons.forEach(b => { const cat = b.dataset.filter; b.querySelector('sup').textContent = pad(cat === 'all' ? photos.length : photos.filter(p => p.category === cat).length); });
    function render(cat, updateUrl = false) {
      active = categories.includes(cat) ? cat : 'all';
      visible = ordered.filter(p => active === 'all' || p.category === active);
      grid.replaceChildren();
      visible.forEach((photo, i) => {
        const card = document.createElement('button');
        card.className = 'gallery-item'; card.dataset.id = photo.id;
        card.setAttribute('aria-label', `查看${photo.title}`);
        const frame = document.createElement('span'); frame.className = 'gallery-item__frame';
        const image = document.createElement('img');
        image.src = photo.thumb; image.alt = photo.title; image.width = photo.width; image.height = photo.height;
        image.loading = i < 6 ? 'eager' : 'lazy'; image.decoding = 'async';
        image.addEventListener('error', () => { frame.classList.add('has-error'); image.style.opacity = '0'; }, { once: true });
        const view = document.createElement('span'); view.className = 'gallery-item__view'; view.textContent = '观看 ↗';
        frame.append(image, view);
        const caption = document.createElement('span'); caption.className = 'gallery-item__meta';
        const title = document.createElement('span'); title.textContent = photo.title;
        const number = document.createElement('small'); number.textContent = `— ${pad(i + 1)}`;
        caption.append(title, number); card.append(frame, caption); grid.append(card);
        card.addEventListener('click', () => open(i, card));
      });
      buttons.forEach(b => { const selected = b.dataset.filter === active; b.classList.toggle('is-active', selected); b.setAttribute('aria-pressed', String(selected)); });
      document.getElementById('galleryCount').textContent = `${pad(visible.length)} 帧影像 · 点击，放慢时间`;
      if (!visible.length) grid.textContent = '影像暂未载入，请刷新后重试。';
      animate(grid, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 450);
      if (updateUrl) {
        const url = new URL(location.href);
        active === 'all' ? url.searchParams.delete('cat') : url.searchParams.set('cat', active);
        history.pushState({}, '', url);
      }
    }
    function setZoom(value) {
      zoomed = value; stage.classList.toggle('is-zoomed', value);
      zoom.textContent = value ? '还原 −' : '放大 ＋'; zoom.setAttribute('aria-pressed', String(value));
      zoom.setAttribute('aria-label', value ? '还原照片大小' : '放大照片');
      stage.scrollTop = stage.scrollLeft = 0;
    }
    function show(next, origin = null, direction = 1) {
      index = (next + visible.length) % visible.length;
      const photo = visible[index], ticket = ++request;
      img.getAnimations().forEach(a => a.cancel()); setZoom(false);
      img.src = photo.thumb; img.alt = photo.title;
      img.width = photo.width; img.height = photo.height;
      img.style.aspectRatio = `${photo.width} / ${photo.height}`;
      document.getElementById('lightboxCaption').textContent = photo.title;
      document.getElementById('lightboxSeries').textContent = names[photo.category];
      document.getElementById('lightboxCounter').textContent = `${pad(index + 1)} / ${pad(visible.length)}`;
      document.getElementById('lightboxProgress').style.width = `${(index + 1) / visible.length * 100}%`;
      status.textContent = '原图载入中…';
      if (origin) {
        const from = origin.querySelector('img').getBoundingClientRect();
        const to = img.getBoundingClientRect();
        if (to.width && to.height) animate(img, [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: .65 }, { transform: 'none', opacity: 1 }], 650);
      } else animate(img, [{ opacity: 0, transform: `translateX(${direction * 35}px) scale(.98)` }, { opacity: 1, transform: 'none' }], 430);
      const full = new Image();
      full.onload = () => { if (ticket === request) { img.src = photo.src; status.textContent = ''; } };
      full.onerror = () => { if (ticket === request) status.textContent = '原图暂不可用，正在显示预览图'; };
      full.src = photo.src;
    }
    function open(i, card) {
      opener = card; savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false');
      background.forEach(el => { el.inert = true; });
      show(i, card); close.focus({ preventScroll: true });
    }
    function dismiss() {
      if (!box.classList.contains('is-open')) return;
      request++; setZoom(false); img.getAnimations().forEach(a => a.cancel());
      box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true');
      background.forEach(el => { el.inert = false; });
      document.body.style.overflow = savedOverflow;
      opener?.focus({ preventScroll: true });
    }
    const step = direction => show(index + direction, null, direction);
    close.addEventListener('click', dismiss);
    document.getElementById('lightboxPrev').addEventListener('click', () => step(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => step(1));
    zoom.addEventListener('click', () => setZoom(!zoomed));
    let lastSwipe = 0;
    img.addEventListener('click', () => { if (Date.now() - lastSwipe > 400) setZoom(!zoomed); });
    box.addEventListener('click', e => { if (e.target === box || e.target === stage) dismiss(); });
    document.addEventListener('keydown', e => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
      if (e.key === 'ArrowRight' && !zoomed) { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft' && !zoomed) { e.preventDefault(); step(-1); }
      if (e.key === 'Tab') {
        const controls = [...box.querySelectorAll('button')];
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    let touch = null;
    stage.addEventListener('touchstart', e => { touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
    stage.addEventListener('touchmove', e => { if (e.touches.length !== 1) touch = null; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (!touch || zoomed) return;
      const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { lastSwipe = Date.now(); step(dx < 0 ? 1 : -1); }
      touch = null;
    }, { passive: true });
    buttons.forEach(b => b.addEventListener('click', () => { if (b.dataset.filter !== active) render(b.dataset.filter, true); }));
    window.addEventListener('popstate', () => { dismiss(); render(new URLSearchParams(location.search).get('cat')); });
    render(new URLSearchParams(location.search).get('cat'));
  }
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); observer.unobserve(en.target); } }), { threshold: .08 });
    reveals.forEach(el => observer.observe(el));
  } else reveals.forEach(el => el.classList.add('is-visible'));
})();
